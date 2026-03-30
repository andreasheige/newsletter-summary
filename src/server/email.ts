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

  // Iterate messages newest-first and stop when past cutoff.
  // This avoids the extremely slow "whose date received >= X" filter
  // which forces Mail.app to scan the entire inbox.
  const script = `
    set output to ""
    set fieldSep to "${FIELD_DELIM}"
    set recSep to "${DELIM}"
    set collected to 0
    set maxMsgs to 5000
    -- Build date in a locale-independent way
    set sinceDate to current date
    set year of sinceDate to ${year}
    set month of sinceDate to ${month}
    set day of sinceDate to ${day}
    set hours of sinceDate to 0
    set minutes of sinceDate to 0
    set seconds of sinceDate to 0
    tell application "Mail"
      with timeout of 300 seconds
        set msgCount to count of messages of inbox
        -- Iterate newest first (message 1 is newest in inbox)
        repeat with i from 1 to msgCount
          if collected >= maxMsgs then exit repeat
          set msg to message i of inbox
          set dt to date received of msg
          -- Stop once we hit messages older than cutoff
          if dt < sinceDate then exit repeat
          set msgId to message id of msg
          set subj to subject of msg
          set sndr to sender of msg
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
          set collected to collected + 1
        end repeat
      end timeout
    end tell
    return output
  `

  try {
    console.log(`[Email] Fetching from Mail.app since ${since.toISOString()}...`)
    const raw = await runAppleScript(script)

    if (!raw) return []

    const records = raw.split(DELIM).filter(r => r.trim())
    const emails: Email[] = records.map(record => {
      const fields = record.split(FIELD_DELIM)
      const [messageId, subject, sender, dateStr, plainBody, htmlBody] = fields
      const plain = (plainBody || '').trim()
      let html = (htmlBody || '').trim()

      // If html content was empty, Mail.app returned MIME source with marker
      if (html.startsWith('%%MIMESRC%%')) {
        const mimeSource = html.slice('%%MIMESRC%%'.length)
        html = extractHtmlFromMime(mimeSource)
      }

      return {
        messageId: (messageId || '').trim(),
        subject: (subject || '(No subject)').trim(),
        sender: (sender || '').trim(),
        date: new Date(dateStr?.trim() || Date.now()),
        text: plain || htmlToText(html),
        html,
        links: extractLinks(html),
      }
    }).filter(e => e.messageId)

    console.log(`[Email] Found ${emails.length} messages from Mail.app`)
    return emails
  } catch (err) {
    console.error('[Email] AppleScript error:', (err as Error).message)
    return []
  }
}

export async function markAsRead(messageIds: string[]): Promise<void> {
  if (!messageIds.length) return

  const idList = messageIds.map(id => `"${id.replace(/"/g, '\\"')}"`).join(', ')
  const script = `
    set idsToMark to {${idList}}
    tell application "Mail"
      repeat with targetId in idsToMark
        try
          set msgs to (messages of inbox whose message id = targetId)
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
