/**
 * Remove emoji characters and clean up surrounding whitespace.
 */
export function stripEmojis(text: string): string {
  if (!text) return ''
  return text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{1F3FB}-\u{1F3FF}\u{2B50}\u{2B55}\u{2934}\u{2935}\u{25AA}-\u{25FE}\u{2B05}-\u{2B07}\u{2B1B}\u{2B1C}\u{3030}\u{303D}\u{3297}\u{3299}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{200B}\u{200C}\u{200D}\u{FEFF}]+/gu, '')
    .replace(/\s+([,.:;!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Check whether a body string contains real newsletter content
 * (as opposed to raw email headers or MIME noise).
 */
export function isRealContent(body: string): boolean {
  if (!body || body.length < 20) return false
  if (/^(Delivered-To:|Received:|From:|DKIM|ARC-|Sign Up \|)/i.test(body)) return false
  if (/Content-Type:|boundary=/i.test(body.slice(0, 200))) return false
  return true
}

/**
 * Strip common LLM preamble from a summary string.
 */
export function cleanSummary(text: string): string {
  if (!text) return ''
  return text
    .replace(/^Here(?:'s| is) (?:a |the )?summary[^:]*:\s*/i, '')
    .replace(/^Summary:\s*/i, '')
    .replace(/\s*(?:Here are \d+ topic )?[Tt]ags:?\s*[\s\S]*$/i, '')
    .trim()
}
