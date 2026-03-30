import { execFile } from 'child_process'
import { htmlToText, extractLinks, extractHtmlFromMime } from './utils.js'
import type { Email } from './types.js'

function runAppleScript(script: string, timeoutMs = 300_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile('osascript', ['-e', script], { maxBuffer: 50 * 1024 * 1024, timeout: timeoutMs }, (err, stdout, stderr) => {
      if (err) {
        const killed = (err as NodeJS.ErrnoException & { killed?: boolean }).killed
        if (killed) {
          reject(new Error(`AppleScript killed after ${timeoutMs / 1000}s timeout`))
        } else if (stderr?.trim()) {
          reject(new Error(stderr.trim()))
        } else {
          // Extract just the meaningful part, not the full command
          const msg = err.message.replace(/^Command failed:.*\n?/, '').trim()
          reject(new Error(msg || 'AppleScript failed (no details)'))
        }
      } else {
        resolve(stdout.trim())
      }
    })
  })
}

export async function fetchNewEmails(since: Date): Promise<Email[]> {
  const year = since.getFullYear()
  const month = since.getMonth() + 1
  const day = since.getDate()

  const DELIM = '%%NLSEP%%'
  const FIELD_DELIM = '%%FLDSEP%%'

  const senderFilter = process.env.NEWSLETTER_SENDERS
    ? process.env.NEWSLETTER_SENDERS.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    : []

  const mailAccount = process.env.MAIL_ACCOUNT || ''
  const mailboxRef = mailAccount
    ? `mailbox "INBOX" of account "${mailAccount}"`
    : 'inbox'

  try {
    console.log(`[Email] Fetching from Mail.app since ${since.toISOString()}...`)

    // Phase 1: Batch-read dates + senders in chunks (very fast)
    // Returns "index%%FLDSEP%%sender" lines for messages in date range
    const CHUNK = 500
    const matchingIndices: Array<{ index: number; sender: string }> = []

    const countRaw = await runAppleScript(
      `tell application "Mail" to count of messages of ${mailboxRef}`,
      30_000,
    )
    const totalCount = parseInt(countRaw) || 0
    console.log(`[Email] Mailbox has ${totalCount} messages, scanning for newsletters...`)

    let pastCutoff = false
    for (let start = 1; start <= totalCount && !pastCutoff; start += CHUNK) {
      const end = Math.min(start + CHUNK - 1, totalCount)

      const scanScript = `
        set output to ""
        set sinceDate to current date
        set year of sinceDate to ${year}
        set month of sinceDate to ${month}
        set day of sinceDate to ${day}
        set hours of sinceDate to 0
        set minutes of sinceDate to 0
        set seconds of sinceDate to 0
        tell application "Mail"
          with timeout of 120 seconds
            set dateList to date received of messages ${start} thru ${end} of ${mailboxRef}
            set senderList to sender of messages ${start} thru ${end} of ${mailboxRef}
            set chunkSize to count of dateList
            repeat with j from 1 to chunkSize
              set dt to item j of dateList
              if dt < sinceDate then
                set output to output & "STOP"
                exit repeat
              end if
              set output to output & (${start} + j - 1) & "${FIELD_DELIM}" & item j of senderList & "
"
            end repeat
          end timeout
        end tell
        return output
      `

      const scanRaw = await runAppleScript(scanScript, 120_000)

      for (const line of scanRaw.split('\n')) {
        if (line.trim() === 'STOP') { pastCutoff = true; break }
        if (!line.trim()) continue
        const [idxStr, sender] = line.split(FIELD_DELIM)
        const idx = parseInt(idxStr)
        if (!idx || !sender) continue

        // Check sender filter
        const senderLower = sender.toLowerCase()
        if (senderFilter.length > 0) {
          if (!senderFilter.some(s => senderLower.includes(s))) continue
        }
        matchingIndices.push({ index: idx, sender })
      }

      console.log(`[Email] Scanned ${end}/${totalCount}, found ${matchingIndices.length} matches so far...`)
    }

    if (matchingIndices.length === 0) {
      console.log(`[Email] No matching newsletters found`)
      return []
    }

    console.log(`[Email] Found ${matchingIndices.length} newsletters, fetching content...`)

    // Phase 2: Fetch full content for matching messages in small batches
    const emails: Email[] = []
    const CONTENT_BATCH = 10

    for (let i = 0; i < matchingIndices.length; i += CONTENT_BATCH) {
      const batch = matchingIndices.slice(i, i + CONTENT_BATCH)
      const indices = batch.map(m => m.index)

      const fetchScript = `
        set output to ""
        set fieldSep to "${FIELD_DELIM}"
        set recSep to "${DELIM}"
        set idxList to {${indices.join(', ')}}
        tell application "Mail"
          with timeout of 120 seconds
            repeat with idx in idxList
              set msg to message idx of ${mailboxRef}
              set msgId to message id of msg
              set subj to subject of msg
              set sndr to sender of msg
              set dt to date received of msg
              set dtStr to (year of dt as text) & "-" & text -2 thru -1 of ("0" & ((month of dt as number) as text)) & "-" & text -2 thru -1 of ("0" & (day of dt as text)) & "T" & text -2 thru -1 of ("0" & (hours of dt as text)) & ":" & text -2 thru -1 of ("0" & (minutes of dt as text)) & ":00"
              set plainBod to "(no content)"
              set htmlBod to ""
              try
                set plainBod to content of msg
              end try
              try
                set htmlBod to html content of msg
              end try
              if length of htmlBod is 0 then
                try
                  set srcBod to source of msg
                  if srcBod contains "text/html" then
                    set htmlBod to "%%MIMESRC%%" & srcBod
                  end if
                end try
              end if
              if length of plainBod > 8000 then set plainBod to text 1 thru 8000 of plainBod
              if length of htmlBod > 200000 then set htmlBod to text 1 thru 200000 of htmlBod
              set output to output & msgId & fieldSep & subj & fieldSep & sndr & fieldSep & dtStr & fieldSep & plainBod & fieldSep & htmlBod & recSep
            end repeat
          end timeout
        end tell
        return output
      `

      const raw = await runAppleScript(fetchScript, 120_000)
      if (!raw) continue

      for (const record of raw.split(DELIM).filter(r => r.trim())) {
        const fields = record.split(FIELD_DELIM)
        const [messageId, subject, sender, dateStr, plainBody, htmlBody] = fields
        const plain = (plainBody || '').trim()
        let html = (htmlBody || '').trim()

        if (html.startsWith('%%MIMESRC%%')) {
          html = extractHtmlFromMime(html.slice('%%MIMESRC%%'.length))
        }

        emails.push({
          messageId: (messageId || '').trim(),
          subject: (subject || '(No subject)').trim(),
          sender: (sender || '').trim(),
          date: new Date(dateStr?.trim() || Date.now()),
          text: plain || htmlToText(html),
          html,
          links: extractLinks(html),
        })
      }

      console.log(`[Email] Fetched content: ${Math.min(i + CONTENT_BATCH, matchingIndices.length)}/${matchingIndices.length}`)
    }

    console.log(`[Email] Done. Got ${emails.length} emails with content`)
    return emails.filter(e => e.messageId)
  } catch (err) {
    console.error('[Email] AppleScript error:', (err as Error).message)
    return []
  }
}

export async function markAsRead(messageIds: string[]): Promise<void> {
  if (!messageIds.length) return

  const mailAccount = process.env.MAIL_ACCOUNT || ''
  const mailboxRef = mailAccount
    ? `mailbox "INBOX" of account "${mailAccount}"`
    : 'inbox'
  const idList = messageIds.map(id => `"${id.replace(/"/g, '\\"')}"`).join(', ')
  const script = `
    set idsToMark to {${idList}}
    tell application "Mail"
      repeat with targetId in idsToMark
        try
          set msgs to (messages of ${mailboxRef} whose message id = targetId)
          repeat with msg in msgs
            set read status of msg to true
          end repeat
        end try
      end repeat
    end tell
  `

  try {
    await runAppleScript(script)
    console.log(`[Email] Marked ${messageIds.length} messages as read`)
  } catch (err) {
    console.error('[Email] Failed to mark as read:', (err as Error).message)
  }
}
