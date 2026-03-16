import { describe, it, expect } from 'vitest'
import { htmlToText, extractLinks, cleanEmailBody, stripEmojis } from './utils.js'

describe('htmlToText', () => {
  it('strips HTML tags', () => {
    expect(htmlToText('<p>Hello <b>world</b></p>')).toBe('Hello world')
  })

  it('returns empty string for empty input', () => {
    expect(htmlToText('')).toBe('')
  })

  it('handles null-ish input', () => {
    expect(htmlToText(undefined as any)).toBe('')
    expect(htmlToText(null as any)).toBe('')
  })

  it('strips style tags and their content', () => {
    expect(htmlToText('<style>.foo { color: red; }</style><p>Text</p>')).toBe('Text')
  })

  it('strips script tags and their content', () => {
    expect(htmlToText('<script>alert("xss")</script><p>Safe</p>')).toBe('Safe')
  })

  it('decodes common HTML entities', () => {
    expect(htmlToText('&amp; &lt; &gt; &quot; &#39; &nbsp;')).toBe('& < > " \'')
  })

  it('collapses multiple whitespace into single space', () => {
    expect(htmlToText('<p>Hello</p>   <p>  World  </p>')).toBe('Hello World')
  })

  it('handles deeply nested HTML', () => {
    expect(htmlToText('<div><div><div><span>Deep</span></div></div></div>')).toBe('Deep')
  })

  it('handles real newsletter HTML with tables', () => {
    const html = '<table><tr><td><h2>Title</h2></td></tr><tr><td>Content here</td></tr></table>'
    expect(htmlToText(html)).toBe('Title Content here')
  })
})

describe('extractLinks', () => {
  it('extracts basic links with href and label', () => {
    const html = '<a href="https://example.com">Example Site</a>'
    const links = extractLinks(html)
    expect(links).toEqual([{ url: 'https://example.com', label: 'Example Site' }])
  })

  it('returns empty array for empty input', () => {
    expect(extractLinks('')).toEqual([])
    expect(extractLinks(undefined as any)).toEqual([])
  })

  it('returns empty array for HTML with no links', () => {
    expect(extractLinks('<p>No links here</p>')).toEqual([])
  })

  it('extracts multiple links', () => {
    const html = `
      <a href="https://a.com">Link A</a>
      <a href="https://b.com">Link B has more text</a>
    `
    const links = extractLinks(html)
    expect(links).toHaveLength(2)
    expect(links[0].url).toBe('https://a.com')
    expect(links[1].url).toBe('https://b.com')
  })

  it('strips HTML tags from link labels', () => {
    const html = '<a href="https://example.com"><strong>Bold</strong> <em>label</em></a>'
    const links = extractLinks(html)
    expect(links[0].label).toBe('Bold label')
  })

  it('skips mailto links', () => {
    const html = '<a href="mailto:test@example.com">Email us here</a>'
    expect(extractLinks(html)).toEqual([])
  })

  it('skips anchor links', () => {
    const html = '<a href="#section">Jump to section</a>'
    expect(extractLinks(html)).toEqual([])
  })

  it('skips links with labels shorter than 5 chars', () => {
    const html = '<a href="https://example.com">Hi</a>'
    expect(extractLinks(html)).toEqual([])
  })

  it('skips unsubscribe and tracking links by URL', () => {
    const urls = [
      'https://example.com/unsubscribe?id=123',
      'https://list-manage.com/track/click',
      'https://example.com/manage.preferences',
      'https://example.com/email.preferences',
      'https://example.com/click?id=123',
      'https://open.substack.com/pub/something',
      'https://beacon.example.com/view',
      'https://example.com/pixel.gif',
      'https://example.com/track/abc123',
    ]
    for (const url of urls) {
      const html = `<a href="${url}">Click this link here</a>`
      expect(extractLinks(html), `should skip: ${url}`).toEqual([])
    }
  })

  it('keeps newsletter redirect links that wrap real content', () => {
    // TLDR and similar newsletters wrap content links through redirects
    const html = '<a href="https://tracking.tldrnewsletter.com/CL0/https:%2F%2Fexample.com%2Farticle/1/abc">Real Article Title Here</a>'
    const links = extractLinks(html)
    expect(links).toHaveLength(1)
    expect(links[0].label).toBe('Real Article Title Here')
  })

  it('skips unsubscribe links by label', () => {
    const labels = [
      'Unsubscribe',
      'View in browser',
      'Update your preferences',
      'Click here',
      'Read more',
      'Learn more',
    ]
    for (const label of labels) {
      const html = `<a href="https://example.com/page">${label}</a>`
      expect(extractLinks(html)).toEqual([])
    }
  })

  it('skips bare social media profile links', () => {
    const urls = [
      'https://twitter.com/',
      'https://www.facebook.com/',
      'https://linkedin.com/',
      'https://x.com/',
    ]
    for (const url of urls) {
      const html = `<a href="${url}">Follow us on social</a>`
      expect(extractLinks(html)).toEqual([])
    }
  })

  it('keeps social media links to specific pages/posts', () => {
    const html = '<a href="https://twitter.com/user/status/123456">Check this tweet out</a>'
    const links = extractLinks(html)
    expect(links).toHaveLength(1)
  })

  it('deduplicates by URL', () => {
    const html = `
      <a href="https://example.com">First mention</a>
      <a href="https://example.com">Second mention</a>
    `
    const links = extractLinks(html)
    expect(links).toHaveLength(1)
    expect(links[0].label).toBe('First mention')
  })

  it('deduplicates by label (case-insensitive)', () => {
    const html = `
      <a href="https://a.com">Same Label Here</a>
      <a href="https://b.com">same label here</a>
    `
    const links = extractLinks(html)
    expect(links).toHaveLength(1)
  })

  it('decodes HTML entities in labels', () => {
    const html = '<a href="https://example.com">Tom &amp; Jerry &nbsp; Show</a>'
    const links = extractLinks(html)
    expect(links[0].label).toBe('Tom & Jerry Show')
  })

  it('handles links with single quotes around href', () => {
    const html = "<a href='https://example.com'>Single quotes work</a>"
    const links = extractLinks(html)
    expect(links).toHaveLength(1)
    expect(links[0].url).toBe('https://example.com')
  })

  it('handles links with extra attributes', () => {
    const html = '<a class="btn" href="https://example.com" target="_blank" rel="noopener">Styled Link Here</a>'
    const links = extractLinks(html)
    expect(links).toHaveLength(1)
  })

  it('handles real TLDR newsletter structure with tracking wrappers', () => {
    const html = `
      <a href="https://tracking.tldrnewsletter.com/CL0/https:%2F%2Fexample.com%2Farticle/1/abc">
        Claude 1M Context Window Now Available
      </a>
      <a href="https://tracking.tldrnewsletter.com/CL0/https:%2F%2Fexample.com%2Ftool/2/def">
        New AI Development Toolkit Released
      </a>
      <a href="https://tracking.tldrnewsletter.com/unsubscribe">Unsubscribe from TLDR</a>
    `
    const links = extractLinks(html)
    // Should get the 2 content links but not unsubscribe
    expect(links).toHaveLength(2)
    expect(links[0].label).toBe('Claude 1M Context Window Now Available')
  })

  it('handles multiline link content', () => {
    const html = `<a href="https://example.com">
      This is a
      multiline label
    </a>`
    const links = extractLinks(html)
    expect(links).toHaveLength(1)
    expect(links[0].label).toBe('This is a multiline label')
  })

  it('skips links that are just images with no text', () => {
    const html = '<a href="https://example.com"><img src="logo.png" alt="" /></a>'
    const links = extractLinks(html)
    expect(links).toEqual([])
  })

  it('uses image alt text as label when present', () => {
    // This is a known edge case — current impl strips tags so alt is lost
    // Documenting current behavior
    const html = '<a href="https://example.com"><img src="logo.png" alt="Company Logo Image" /></a>'
    const links = extractLinks(html)
    // After stripping tags, label becomes empty, so it gets filtered
    expect(links).toEqual([])
  })
})

describe('cleanEmailBody', () => {
  it('returns empty string for empty input', () => {
    expect(cleanEmailBody('')).toBe('')
    expect(cleanEmailBody(undefined as any)).toBe('')
    expect(cleanEmailBody(null as any)).toBe('')
  })

  it('passes through clean plain text unchanged', () => {
    const text = 'This is a normal newsletter about AI developments.'
    expect(cleanEmailBody(text)).toBe(text)
  })

  it('strips MIME headers from email source', () => {
    const mime = `Delivered-To: user@gmail.com
Received: by 2002:a17:505:1fcb with SMTP id dw11csp1652563njc;
DKIM-Signature: v=1; a=rsa-sha256; d=example.com;
From: Newsletter <news@example.com>
To: user@gmail.com
Subject: AI News Today
MIME-Version: 1.0
Content-Type: text/plain; charset=utf-8

This is the actual body of the email.`
    expect(cleanEmailBody(mime)).toBe('This is the actual body of the email.')
  })

  it('strips MIME headers with multipart boundary', () => {
    const mime = `From: TLDR AI <dan@tldrnewsletter.com>
To: user@gmail.com
Subject: Claude 1M Context
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary=UOXGOQmu

--UOXGOQmu
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: quoted-printable

Claude Opus 4.6 now includes the full 1M context window.
--UOXGOQmu
Content-Type: text/html; charset=utf-8

<html><body>Claude Opus 4.6</body></html>
--UOXGOQmu--`
    const result = cleanEmailBody(mime)
    expect(result).toContain('Claude Opus 4.6 now includes the full 1M context window')
    expect(result).not.toContain('From:')
    expect(result).not.toContain('DKIM')
    expect(result).not.toContain('boundary')
  })

  it('decodes quoted-printable encoding', () => {
    const qp = `Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: quoted-printable

Hello =C2=A0world. This is a test=20
with soft line=
 breaks and =E2=80=93 dashes.`
    const result = cleanEmailBody(qp)
    expect(result).toContain('Hello')
    expect(result).toContain('world')
    expect(result).not.toContain('=C2=A0')
    expect(result).not.toContain('=E2=80=93')
    expect(result).not.toContain('Content-Transfer-Encoding')
  })

  it('strips multipart boundary markers', () => {
    const text = `--UOXGOQmu
Content-Type: text/plain; charset=utf-8

Actual content here.
--UOXGOQmu--`
    const result = cleanEmailBody(text)
    expect(result).toContain('Actual content here')
    expect(result).not.toContain('--UOXGOQmu')
  })

  it('strips zero-width characters and invisible Unicode', () => {
    const text = 'Hello\u200C \u200B\u00A0world\uFEFF here'
    const result = cleanEmailBody(text)
    expect(result).toBe('Hello world here')
  })

  it('handles real TLDR MIME email source', () => {
    const mime = `Delivered-To: a.heige.83@gmail.com
Received: by 2002:a17:505:1fcb:b0:1dfc:7fad:4e6f with SMTP id dw11csp1652563njc;
ARC-Seal: i=1; a=rsa-sha256; t=1773669364;
DKIM-Signature: v=1; a=rsa-sha256; q=dns/txt;
From: TLDR AI <dan@tldrnewsletter.com>
To: a.heige.83@gmail.com
Subject: Claude 1M Context
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary=UOXGOQmu

--UOXGOQmu
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: quoted-printable

Claude Opus 4.6 and Sonnet 4.6 now include the full 1M context window at =
standard pricing on the Claude Platform. This means fewer compactions.=20

HEADLINES & LAUNCHES

1M CONTEXT IS NOW GENERALLY AVAILABLE (5 MINUTE READ) [5]=20

Claude Opus 4.6 and Sonnet 4.6 now include the full 1M context window.
--UOXGOQmu
Content-Type: text/html; charset=utf-8

<html><body>HTML version</body></html>
--UOXGOQmu--`
    const result = cleanEmailBody(mime)
    expect(result).toContain('Claude Opus 4.6')
    expect(result).toContain('HEADLINES')
    expect(result).not.toContain('Delivered-To')
    expect(result).not.toContain('DKIM-Signature')
    expect(result).not.toContain('ARC-Seal')
    expect(result).not.toContain('boundary=')
  })

  it('handles email with only headers and no double-newline separator', () => {
    // Some malformed MIME might not have a proper header/body separator
    const text = 'Received: from server\nX-Header: value\nActual content starts here'
    const result = cleanEmailBody(text)
    // Should still try to extract something useful
    expect(result.length).toBeGreaterThan(0)
  })

  it('prefers text/plain part from multipart emails', () => {
    const mime = `Content-Type: multipart/alternative; boundary=ABC

--ABC
Content-Type: text/plain; charset=utf-8

Plain text version of the newsletter.
--ABC
Content-Type: text/html; charset=utf-8

<html><body><p>HTML version</p></body></html>
--ABC--`
    const result = cleanEmailBody(mime)
    expect(result).toContain('Plain text version')
  })

  it('collapses excessive newlines', () => {
    const text = 'Line one.\n\n\n\n\n\nLine two.\n\n\n\nLine three.'
    expect(cleanEmailBody(text)).toBe('Line one.\n\nLine two.\n\nLine three.')
  })

  it('strips combining grapheme joiner (U+034F) padding', () => {
    const text = 'Hello \u034F \u034F \u034F \u034F world'
    const result = cleanEmailBody(text)
    expect(result).toBe('Hello world')
  })

  it('strips object replacement character (U+FFFC)', () => {
    const text = 'Image \uFFFC here \uFFFC and there'
    const result = cleanEmailBody(text)
    expect(result).toBe('Image here and there')
  })

  it('strips LinkedIn email boilerplate', () => {
    const text = `Coding still matters. But it is no longer what separates skilled developers.

Skill #1: Learn how to delegate reasoning.

Läs den här artikeln på LinkedIn för att delta i konversationen
Läs på LinkedIn
Detta e-postmeddelande var avsett för Andreas Heige (Webbutvecklare på Grebban)
Läs mer om varför detta visas.
Du tar emot e-postaviseringar från LinkedIn.
Andra kan se att du prenumererar.
Avregistrera · Hjälp
© 2026 LinkedIn Ireland Unlimited Company, Wilton Plaza, Wilton Place, Dublin 2, Irland.
LinkedIn är ett registrerat företagsnamn för LinkedIn Ireland Unlimited Company.`
    const result = cleanEmailBody(text)
    expect(result).toContain('Coding still matters')
    expect(result).toContain('delegate reasoning')
    expect(result).not.toContain('Avregistrera')
    expect(result).not.toContain('LinkedIn Ireland')
    expect(result).not.toContain('e-postaviseringar')
  })

  it('strips Content-Type and Content-Transfer-Encoding lines mid-text', () => {
    const text = `Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: quoted-printable

Here is the actual newsletter content about AI.`
    const result = cleanEmailBody(text)
    expect(result).toBe('Here is the actual newsletter content about AI.')
  })

  it('handles single-line MIME (no newlines, all spaces)', () => {
    const mime = 'Delivered-To: user@gmail.com Received: by 2002:a17 DKIM-Signature: v=1; a=rsa-sha256 From: TLDR <dan@tldrnewsletter.com> To: user@gmail.com Subject: AI News MIME-Version: 1.0 Content-Type: multipart/alternative; boundary=ABC --ABC Content-Type: text/plain; charset=utf-8 Content-Transfer-Encoding: quoted-printable Sign Up TLDR 2026-03-16 Big Tech & Startups Cursor Goes To War (12 minute read) Until recently, Cursor seemed unstoppable. --ABC Content-Type: text/html; charset=utf-8 <html>stuff</html> --ABC--'
    const result = cleanEmailBody(mime)
    expect(result).toContain('Cursor Goes To War')
    expect(result).not.toContain('Delivered-To')
    expect(result).not.toContain('DKIM-Signature')
  })

  it('handles single-line MIME without boundary (simple MIME)', () => {
    const mime = 'Delivered-To: user@gmail.com Received: by server From: News <news@example.com> Subject: Headlines MIME-Version: 1.0 Content-Type: text/plain; charset=utf-8 Content-Transfer-Encoding: quoted-printable Here is the actual newsletter content about AI.'
    const result = cleanEmailBody(mime)
    expect(result).toContain('newsletter content about AI')
    expect(result).not.toContain('Delivered-To')
  })
})

describe('stripEmojis', () => {
  it('returns empty string for empty input', () => {
    expect(stripEmojis('')).toBe('')
    expect(stripEmojis(undefined as any)).toBe('')
  })

  it('removes common emojis', () => {
    expect(stripEmojis('Claude 1M Context \u{1F9E0}, OpenAI adult mode \u{1F916}')).toBe('Claude 1M Context, OpenAI adult mode')
  })

  it('preserves text without emojis', () => {
    expect(stripEmojis('Normal text here')).toBe('Normal text here')
  })

  it('removes lightning bolt emoji', () => {
    expect(stripEmojis('GLM-5-Turbo \u26A1')).toBe('GLM-5-Turbo')
  })

  it('removes multiple emojis and collapses spaces', () => {
    expect(stripEmojis('\u{1F680} Headlines & \u{1F4E3} Launches \u{1F31F}')).toBe('Headlines & Launches')
  })

  it('handles emoji sequences (skin tones, ZWJ)', () => {
    expect(stripEmojis('Hello \u{1F44B}\u{1F3FD} World')).toBe('Hello World')
  })

  it('removes rocket, fire, star, point emojis', () => {
    expect(stripEmojis('\u{1F525} Hot \u{2B50} Star \u{1F449} Link')).toBe('Hot Star Link')
  })

  it('does not remove regular symbols like & or @', () => {
    expect(stripEmojis('Tom & Jerry @ Home')).toBe('Tom & Jerry @ Home')
  })

  it('trims result', () => {
    expect(stripEmojis('\u{1F680} Starting here')).toBe('Starting here')
  })
})
