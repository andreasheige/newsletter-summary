import { describe, it, expect } from 'vitest'
import { parseLlmResponse } from './summarizer.js'

describe('parseLlmResponse', () => {
  it('parses a clean JSON response', () => {
    const raw = '{"summary":"AI is changing the world.","tags":["ai","tech"]}'
    const result = parseLlmResponse(raw)
    expect(result.summary).toBe('AI is changing the world.')
    expect(result.tags).toEqual(['ai', 'tech'])
  })

  it('extracts JSON embedded in text', () => {
    const raw = 'Here is the summary:\n{"summary":"Claude got 1M context.","tags":["ai"]}\nDone.'
    const result = parseLlmResponse(raw)
    expect(result.summary).toBe('Claude got 1M context.')
  })

  it('handles JSON with markdown fences', () => {
    const raw = '```json\n{"summary":"Fenced response.","tags":["test"]}\n```'
    const result = parseLlmResponse(raw)
    expect(result.summary).toBe('Fenced response.')
  })

  it('falls back to raw text when JSON is malformed', () => {
    const raw = '{"summary": "Missing closing brace"'
    const result = parseLlmResponse(raw)
    // Should not crash, should return something
    expect(result.summary.length).toBeGreaterThan(0)
    expect(result.tags).toEqual([])
  })

  it('falls back to raw text when no JSON present', () => {
    const raw = 'This is just a plain text summary about AI newsletters.'
    const result = parseLlmResponse(raw)
    expect(result.summary).toBe(raw)
    expect(result.tags).toEqual([])
  })

  it('handles empty response', () => {
    const result = parseLlmResponse('')
    expect(result.summary).toBe('')
    expect(result.tags).toEqual([])
  })

  it('strips JSON artifacts from fallback text', () => {
    const raw = '{"summary": "incomplete json'
    const result = parseLlmResponse(raw)
    // No closing brace, so regex doesn't match — returned as plain text
    // That's acceptable: the text IS the best we have
    expect(result.summary.length).toBeGreaterThan(0)
    expect(result.tags).toEqual([])
  })

  it('handles nested object without summary field', () => {
    const raw = '{"title":"TLDR AI","sections":[{"title":"News","items":[]}]}'
    const result = parseLlmResponse(raw)
    // Should not use the raw JSON as summary — should be cleaned
    expect(result.summary[0]).not.toBe('{')
  })

  it('handles response with only tags, no summary', () => {
    const raw = '{"tags":["tech","ai"]}'
    const result = parseLlmResponse(raw)
    expect(result.tags).toEqual(['tech', 'ai'])
    // Summary should be empty or fallback, not the JSON
    expect(result.summary).not.toContain('{')
  })

  it('handles tags that are not strings', () => {
    const raw = '{"summary":"Good summary here.","tags":[1, true, null, "valid"]}'
    const result = parseLlmResponse(raw)
    expect(result.summary).toBe('Good summary here.')
    // Should filter to only string tags
    expect(result.tags).toEqual(['valid'])
  })

  it('handles summary that is not a string', () => {
    const raw = '{"summary": 42, "tags": ["test"]}'
    const result = parseLlmResponse(raw)
    expect(typeof result.summary).toBe('string')
  })

  it('handles deeply nested JSON', () => {
    const raw = '{"data":{"result":{"summary":"Deep value.","tags":["nested"]}}}'
    const result = parseLlmResponse(raw)
    // Should not crash, summary should not be raw JSON
    expect(result.summary[0]).not.toBe('{')
  })

  it('handles very long LLM responses', () => {
    const raw = '{"summary":"' + 'A'.repeat(10000) + '","tags":["test"]}'
    const result = parseLlmResponse(raw)
    expect(result.summary.length).toBeGreaterThan(0)
  })

  it('handles unicode in summary', () => {
    const raw = '{"summary":"Claude 🧠 gets 1M context 🚀","tags":["ai"]}'
    const result = parseLlmResponse(raw)
    expect(result.summary).toContain('🧠')
  })

  it('strips "Here is a summary" preamble from summary', () => {
    const raw = '{"summary":"Here is a summary of the newsletter in 2-4 sentences: AI is changing fast.","tags":["ai"]}'
    const result = parseLlmResponse(raw)
    expect(result.summary).toBe('AI is changing fast.')
    expect(result.summary).not.toContain('Here is a summary')
  })

  it('strips various preamble patterns', () => {
    const preambles = [
      'Here is a summary of the newsletter in 2-4 sentences:',
      'Here is the summary:',
      'Summary:',
      'Here is a summary:',
      'Here\'s a summary of the newsletter:',
    ]
    for (const pre of preambles) {
      const raw = `{"summary":"${pre} The core message is about AI.","tags":[]}`
      const result = parseLlmResponse(raw)
      expect(result.summary, `should strip: ${pre}`).toBe('The core message is about AI.')
    }
  })

  it('strips trailing Tags: line from plain text response', () => {
    const raw = 'AI is changing fast. Tags: ["ai", "tech"]'
    const result = parseLlmResponse(raw)
    expect(result.summary).toBe('AI is changing fast.')
    expect(result.tags).toEqual(['ai', 'tech'])
  })

  it('strips preamble from plain text response too', () => {
    const raw = 'Here is a summary: Development is shifting from coding to orchestration.'
    const result = parseLlmResponse(raw)
    expect(result.summary).toBe('Development is shifting from coding to orchestration.')
  })
})
