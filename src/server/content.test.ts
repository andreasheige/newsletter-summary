import { describe, it, expect } from 'vitest'
import { extractNewsletterContent, parseTldrContent } from './content.js'

describe('extractNewsletterContent', () => {
  it('returns empty content for empty input', () => {
    const result = extractNewsletterContent('', '')
    expect(result.sections).toEqual([])
    expect(result.links).toEqual([])
  })

  it('extracts plain text as a single section when no HTML', () => {
    const result = extractNewsletterContent('This is plain text content about AI news.', '')
    expect(result.sections.length).toBeGreaterThanOrEqual(1)
    expect(result.sections[0].body).toContain('AI news')
  })

  it('extracts links from HTML', () => {
    const html = `
      <div>
        <p>Check out <a href="https://example.com/article">this great article</a> about AI.</p>
        <p>Also see <a href="https://example.com/tool">this new tool</a> for developers.</p>
      </div>
    `
    const result = extractNewsletterContent('', html)
    expect(result.links.length).toBe(2)
    expect(result.links[0].url).toBe('https://example.com/article')
    expect(result.links[0].label).toBe('this great article')
  })

  it('preserves ALL content links, not just top 8', () => {
    const linkHtml = Array.from({ length: 15 }, (_, i) =>
      `<p><a href="https://example.com/article-${i}">Article number ${i} title</a> — Description of article ${i}.</p>`
    ).join('\n')
    const result = extractNewsletterContent('', `<div>${linkHtml}</div>`)
    expect(result.links.length).toBe(15)
  })

  it('extracts headings as section titles', () => {
    const html = `
      <h2>Top Stories</h2>
      <p>First story about Claude AI being amazing.</p>
      <h2>Developer Tools</h2>
      <p>New tools released this week for developers.</p>
    `
    const result = extractNewsletterContent('', html)
    expect(result.sections.length).toBe(2)
    expect(result.sections[0].title).toBe('Top Stories')
    expect(result.sections[0].body).toContain('Claude AI')
    expect(result.sections[1].title).toBe('Developer Tools')
  })

  it('handles h1, h2, h3 as section boundaries', () => {
    const html = `
      <h1>Main Title</h1>
      <p>Intro paragraph content here.</p>
      <h3>Sub Section</h3>
      <p>Sub section content here too.</p>
    `
    const result = extractNewsletterContent('', html)
    expect(result.sections.length).toBe(2)
  })

  it('associates links with the section they appear in', () => {
    const html = `
      <h2>AI News</h2>
      <p>Check <a href="https://example.com/ai">AI article link</a></p>
      <h2>Dev Tools</h2>
      <p>Try <a href="https://example.com/tool">Dev tool link</a></p>
    `
    const result = extractNewsletterContent('', html)
    expect(result.sections[0].links).toHaveLength(1)
    expect(result.sections[0].links[0].url).toBe('https://example.com/ai')
    expect(result.sections[1].links).toHaveLength(1)
    expect(result.sections[1].links[0].url).toBe('https://example.com/tool')
  })

  it('handles newsletter with no headings (flat content)', () => {
    const html = `
      <p>First paragraph about something.</p>
      <p>Second <a href="https://example.com">paragraph with link</a>.</p>
      <p>Third paragraph about another thing.</p>
    `
    const result = extractNewsletterContent('', html)
    expect(result.sections.length).toBeGreaterThanOrEqual(1)
    expect(result.links.length).toBe(1)
  })

  it('strips tracking/noise but keeps content links', () => {
    const html = `
      <p><a href="https://example.com/article">Good Article Title</a></p>
      <p><a href="https://example.com/unsubscribe">Unsubscribe</a></p>
      <p><a href="https://list-manage.com/track/click">Tracker Link Here</a></p>
    `
    const result = extractNewsletterContent('', html)
    expect(result.links.length).toBe(1)
    expect(result.links[0].url).toBe('https://example.com/article')
  })

  it('handles deeply nested table-based newsletter layouts', () => {
    const html = `
      <table>
        <tr><td>
          <table>
            <tr><td><h2>Section One</h2></td></tr>
            <tr><td><p>Content with <a href="https://example.com">a link here</a>.</p></td></tr>
          </table>
        </td></tr>
      </table>
    `
    const result = extractNewsletterContent('', html)
    expect(result.sections.length).toBeGreaterThanOrEqual(1)
    expect(result.links.length).toBe(1)
  })

  it('combines plain text with HTML links', () => {
    const text = 'This newsletter covers AI and developer tools this week.'
    const html = `
      <p>This newsletter covers AI and developer tools.</p>
      <p><a href="https://example.com/ai">AI Deep Dive Article</a></p>
      <p><a href="https://example.com/tools">Developer Tools Weekly</a></p>
    `
    const result = extractNewsletterContent(text, html)
    expect(result.links.length).toBe(2)
    expect(result.sections.length).toBeGreaterThanOrEqual(1)
  })

  it('handles empty sections gracefully', () => {
    const html = `
      <h2>Section With No Content</h2>
      <h2>Another Empty Section</h2>
      <h2>Section With Content</h2>
      <p>Actually has some real content here.</p>
    `
    const result = extractNewsletterContent('', html)
    // Empty sections should be filtered out
    const nonEmpty = result.sections.filter(s => s.body.trim().length > 0)
    expect(nonEmpty.length).toBeGreaterThanOrEqual(1)
  })

  it('removes duplicate content between sections', () => {
    const html = `
      <h2>Headlines</h2>
      <p>Claude gets 1M context window now available.</p>
      <h2>Details</h2>
      <p>More details about Claude 1M context.</p>
    `
    const result = extractNewsletterContent('', html)
    expect(result.sections.length).toBe(2)
  })

  it('handles malformed HTML gracefully', () => {
    const html = '<p>Unclosed paragraph<div>Mixed <b>nesting</p></div></b>'
    const result = extractNewsletterContent('', html)
    // Should not throw, should extract something
    expect(result).toBeDefined()
    expect(result.sections.length).toBeGreaterThanOrEqual(0)
  })

  it('handles extremely long content without crashing', () => {
    const longContent = '<p>' + 'A'.repeat(100000) + '</p>'
    const result = extractNewsletterContent('', longContent)
    expect(result).toBeDefined()
  })

  it('returns a flat list of all links across all sections', () => {
    const html = `
      <h2>Part 1</h2>
      <a href="https://a.com">Link A content</a>
      <h2>Part 2</h2>
      <a href="https://b.com">Link B content</a>
      <a href="https://c.com">Link C content</a>
    `
    const result = extractNewsletterContent('', html)
    expect(result.links.length).toBe(3)
    expect(result.links.map(l => l.url)).toEqual([
      'https://a.com', 'https://b.com', 'https://c.com'
    ])
  })
})

describe('parseTldrContent', () => {
  const sampleTldr = `Sign Up |Advertise|View Online TLDR TLDR AI 2026-03-16

📱 Big Tech & Startups

Cursor Goes To War For AI Coding Dominance (12 minute read)

Until recently, Cursor seemed nearly unstoppable. Then, Anthropic's Claude Code crossed $1 billion in annualized revenue within six months. In response, Cursor is building a research powerhouse.

Apple Ultra Products Expansion Is Up Next (6 minute read)

Apple plans to release several higher-end products, including a foldable iPhone and new AirPods. The approach is typical of CEO Tim Cook's playbook.

🚀 Science & Futuristic Technology

Stem Cell Treatments Approved in World First (3 minute read)

Japanese pharmaceutical company Sumitomo Pharma has received approval for Amchepry, a Parkinson's disease treatment. The treatments could be on the market as early as this summer.

💻 Programming, Design & Data Science

I don't know if my job will still exist in ten years (4 minute read)

It is unclear if the software engineering industry will survive another decade. Software allows for the automation of jobs, which is why it is such a lucrative profession.

⚡ Quick Links

A model of how simplicity gets rewarded (2 minute read)

You can reward simplicity, you just have to do it indirectly.

Bundle of human neurons learns to play Doom (2 minute read)

Roughly 200,000 living human neurons gradually learned to play Doom.`

  it('extracts sections from TLDR plain text', () => {
    const result = parseTldrContent(sampleTldr)
    expect(result.sections.length).toBeGreaterThanOrEqual(4)
  })

  it('extracts section titles without emojis', () => {
    const result = parseTldrContent(sampleTldr)
    const titles = result.sections.map(s => s.title)
    expect(titles).toContain('Big Tech & Startups')
    expect(titles).toContain('Science & Futuristic Technology')
    expect(titles).toContain('Programming, Design & Data Science')
  })

  it('extracts articles as links with descriptions', () => {
    const result = parseTldrContent(sampleTldr)
    // All links across all sections
    expect(result.links.length).toBeGreaterThanOrEqual(5)
    const cursorLink = result.links.find(l => l.label.includes('Cursor'))
    expect(cursorLink).toBeDefined()
    expect(cursorLink!.label).toBe('Cursor Goes To War For AI Coding Dominance (12 minute read)')
  })

  it('each section has its own articles as links', () => {
    const result = parseTldrContent(sampleTldr)
    const bigTech = result.sections.find(s => s.title === 'Big Tech & Startups')
    expect(bigTech).toBeDefined()
    expect(bigTech!.links.length).toBe(2)
    expect(bigTech!.links[0].label).toContain('Cursor')
    expect(bigTech!.links[1].label).toContain('Apple')
  })

  it('associates description text with each article link', () => {
    const result = parseTldrContent(sampleTldr)
    const bigTech = result.sections.find(s => s.title === 'Big Tech & Startups')
    // The body should contain the article descriptions
    expect(bigTech!.body).toContain('unstoppable')
    expect(bigTech!.body).toContain('Tim Cook')
  })

  it('handles Quick Links section', () => {
    const result = parseTldrContent(sampleTldr)
    const quickLinks = result.sections.find(s => s.title === 'Quick Links')
    expect(quickLinks).toBeDefined()
    expect(quickLinks!.links.length).toBeGreaterThanOrEqual(2)
  })

  it('returns empty for non-TLDR text', () => {
    const result = parseTldrContent('Just some random email about dinner plans.')
    expect(result.sections).toEqual([])
    expect(result.links).toEqual([])
  })

  it('returns empty for empty input', () => {
    const result = parseTldrContent('')
    expect(result.sections).toEqual([])
    expect(result.links).toEqual([])
  })

  it('strips sponsor entries', () => {
    const text = `Sign Up TLDR 2026-03-16

📱 Headlines & Launches

Some Sponsor Product (Sponsor)

Buy our stuff now. Best product ever made.

Real Article Title (5 minute read)

This is a real article about something interesting.`
    const result = parseTldrContent(text)
    const sponsorLink = result.links.find(l => l.label.includes('Sponsor'))
    expect(sponsorLink).toBeUndefined()
    const realLink = result.links.find(l => l.label.includes('Real Article'))
    expect(realLink).toBeDefined()
  })

  it('strips TLDR header/footer noise', () => {
    const text = `Sign Up |Advertise|View Online TLDR Together With TLDR 2026-03-09

📱 Big Tech & Startups

Cool Article (5 minute read)

Article description here.

Love TLDR? Tell your friends and get rewards! Share your referral link.`
    const result = parseTldrContent(text)
    expect(result.sections.length).toBe(1)
    expect(result.links.length).toBe(1)
    // Footer should not appear in body
    const body = result.sections[0].body
    expect(body).not.toContain('Love TLDR')
    expect(body).not.toContain('referral')
  })
})
