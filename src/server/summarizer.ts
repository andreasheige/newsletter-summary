import { execFile } from 'child_process'
import type { RawLink } from './types.js'
import type { Link } from '../shared/types.js'

const OLLAMA_URL = () => process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = () => process.env.OLLAMA_MODEL || 'llama3.2'
const OPENAI_API_KEY = () => process.env.OPENAI_API_KEY || ''
const OPENAI_MODEL = () => process.env.OPENAI_MODEL || 'gpt-4.1-mini'

export function useOpenAI(): boolean {
  // Disabled — set to true manually when OpenAI quota is available
  return false
}

export function getProviderInfo(): { provider: string; model: string } {
  if (useOpenAI()) return { provider: 'openai', model: OPENAI_MODEL() }
  return { provider: 'ollama', model: OLLAMA_MODEL() }
}

let starting = false

export async function ensureOllamaRunning(): Promise<boolean> {
  if (useOpenAI()) {
    console.log(`[OpenAI] Using OpenAI (${OPENAI_MODEL()}) — skipping Ollama`)
    return true
  }

  let serverUp = false
  try {
    const resp = await fetch(`${OLLAMA_URL()}/api/version`)
    serverUp = resp.ok
  } catch {
    // not running
  }

  if (!serverUp) {
    if (starting) {
      console.log('[Ollama] Already starting, waiting...')
      await new Promise(r => setTimeout(r, 5000))
      return ensureOllamaRunning()
    }

    starting = true
    console.log('[Ollama] Not running — starting ollama serve...')

    const child = execFile('ollama', ['serve'], { detached: true, stdio: 'ignore' } as any)
    child.unref()

    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000))
      try {
        const resp = await fetch(`${OLLAMA_URL()}/api/version`)
        if (resp.ok) {
          console.log('[Ollama] Server started')
          break
        }
      } catch {
        // still starting
      }
      if (i === 14) {
        starting = false
        throw new Error('Failed to start Ollama after 30s')
      }
    }
    starting = false
  }

  const model = OLLAMA_MODEL()
  try {
    const resp = await fetch(`${OLLAMA_URL()}/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model }),
    })
    if (resp.ok) return true
  } catch {
    // model not found
  }

  console.log(`[Ollama] Model "${model}" not found — pulling (this may take a while)...`)
  const resp = await fetch(`${OLLAMA_URL()}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: model, stream: false }),
  })

  if (!resp.ok) {
    const body = await resp.text()
    throw new Error(`Failed to pull model "${model}": ${body}`)
  }

  console.log(`[Ollama] Model "${model}" pulled successfully`)
  return true
}

interface SummarizeResult {
  summary: string
  tags: string[]
  links: Link[]
}

/**
 * Parse LLM response text into a structured summary + tags.
 * Handles clean JSON, embedded JSON, malformed JSON, and plain text.
 */
/**
 * Strip common LLM preambles from a summary string.
 */
function stripPreamble(text: string): string {
  return text
    .replace(/^Here(?:'s| is) (?:a |the )?summary(?: of the newsletter)?(?:\s+in \d+-\d+ sentences)?:\s*/i, '')
    .replace(/^Summary:\s*/i, '')
    .trim()
}

export function parseLlmResponse(raw: string): { summary: string; tags: string[] } {
  if (!raw) return { summary: '', tags: [] }

  // Try to extract JSON from the response
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])

      let summary = ''
      let tags: string[] = []

      if (typeof parsed.summary === 'string') {
        summary = stripPreamble(parsed.summary)
      }

      if (Array.isArray(parsed.tags)) {
        tags = parsed.tags.filter((t: unknown) => typeof t === 'string')
      }

      // If we got a summary, use it
      if (summary) {
        return { summary, tags }
      }

      // No summary field — don't use raw JSON as summary
      // Clean it up as plain text
      const cleaned = raw.replace(/[{}\[\]"]/g, '').replace(/\s+/g, ' ').trim()
      return { summary: stripPreamble(cleaned), tags }
    } catch {
      // Malformed JSON — strip JSON artifacts
      const cleaned = raw.replace(/[{}\[\]"]/g, '').replace(/\s+/g, ' ').trim()
      return { summary: stripPreamble(cleaned), tags: [] }
    }
  }

  // No JSON found — extract tags from various LLM formats
  let text = raw
  let tags: string[] = []

  // Format: Tags: ["tag1", "tag2"]
  const tagsJsonMatch = text.match(/\s*Tags:\s*\[([^\]]*)\]\s*$/i)
  if (tagsJsonMatch) {
    text = text.slice(0, tagsJsonMatch.index).trim()
    try {
      tags = JSON.parse(`[${tagsJsonMatch[1]}]`).filter((t: unknown) => typeof t === 'string')
    } catch { /* ignore */ }
  }

  // Format: Tags: * "tag1" * "tag2"  OR  - "tag1" - "tag2"  OR numbered/bulleted
  if (tags.length === 0) {
    const tagsSectionMatch = text.match(/\s*(?:Here are \d+ topic )?[Tt]ags:?\s*([\s\S]*)$/i)
    if (tagsSectionMatch) {
      text = text.slice(0, tagsSectionMatch.index).trim()
      const tagText = tagsSectionMatch[1]
      const extracted = tagText.match(/[""]([^""]+)[""]|[*\-•]\s*([^*\-•\n]+)/g)
      if (extracted) {
        tags = extracted.map(t => t.replace(/^[*\-•\d.)\s]+/, '').replace(/[""\s]+/g, ' ').trim()).filter(t => t.length > 1)
      }
    }
  }

  return { summary: stripPreamble(text), tags }
}

async function summarizeWithOpenAI(prompt: string): Promise<string> {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY()}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL(),
      messages: [
        { role: 'system', content: 'You summarize newsletters. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    }),
  })

  if (!resp.ok) {
    const body = await resp.text()
    throw new Error(`OpenAI returned ${resp.status}: ${body}`)
  }

  const data = await resp.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices[0].message.content.trim()
}

async function summarizeWithOllama(prompt: string): Promise<string> {
  await ensureOllamaRunning()

  const resp = await fetch(`${OLLAMA_URL()}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL(),
      prompt,
      stream: false,
      options: { temperature: 0.3 },
    }),
  })

  if (!resp.ok) throw new Error(`Ollama returned ${resp.status}`)

  const data = await resp.json() as { response: string }
  return data.response.trim()
}

export async function summarize(subject: string, text: string, links: RawLink[] = []): Promise<SummarizeResult> {
  const prompt = `Summarize this newsletter in 2-4 sentences. Then list 1-4 topic tags.

Return a JSON object like: {"summary":"Your summary here.","tags":["tag1","tag2"]}

Subject: ${subject}

Content:
${text.slice(0, 6000)}

JSON:`

  try {
    const raw = useOpenAI()
      ? await summarizeWithOpenAI(prompt)
      : await summarizeWithOllama(prompt)

    const { summary, tags } = parseLlmResponse(raw)

    const contentLinks: Link[] = links
      .filter(l => l.url && l.label && l.label.length > 5)
      .map(l => ({
        url: l.url,
        title: l.label,
        description: '',
      }))

    return { summary, tags, links: contentLinks }
  } catch (err) {
    console.error('Summarization error:', (err as Error).message)
    return {
      summary: `Could not summarize: ${(err as Error).message}`,
      tags: [],
      links: [],
    }
  }
}
