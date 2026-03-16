import { execFile } from 'child_process'
import { htmlToText, extractLinks, extractHtmlFromMime } from './utils.js'
import type { Email } from './types.js'

function runAppleScript(script: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('osascript', ['-e', script], { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message))
      else resolve(stdout.trim())
    })
  })
}

export async function fetchNewEmails(since: Date): Promise<Email[]> {
  const year = since.getFullYear()
  const month = since.getMonth() + 1
  const day = since.getDate()

  const DELIM = '%%NLSEP%%'
  const FIELD_DELIM = '%%FLDSEP%%'

  const script = `
    set output to ""
    set fieldSep to "${FIELD_DELIM}"
    set recSep to "${DELIM}"
    -- Build date in a locale-independent way
    set sinceDate to current date
    set year of sinceDate to ${year}
    set month of sinceDate to ${month}
    set day of sinceDate to ${day}
    set hours of sinceDate to 0
    set minutes of sinceDate to 0
    set seconds of sinceDate to 0
    tell application "Mail"
      set msgs to (messages of inbox whose date received >= sinceDate)
      set msgCount to count of msgs
      if msgCount > 1000 then set msgCount to 1000
      repeat with i from 1 to msgCount
        set msg to item i of msgs
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
        if length of htmlBod > 50000 then set htmlBod to text 1 thru 50000 of htmlBod
        set output to output & msgId & fieldSep & subj & fieldSep & sndr & fieldSep & dtStr & fieldSep & plainBod & fieldSep & htmlBod & recSep
      end repeat
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
