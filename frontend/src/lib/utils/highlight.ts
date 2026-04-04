/**
 * Splits a text string into segments, marking which parts match the query.
 * Used by SearchResults to wrap matching text in <mark> elements.
 */
export interface TextSegment {
  text: string
  isMatch: boolean
}

/**
 * Returns an array of text segments for rendering highlighted search results.
 * Case-insensitive. Returns a single non-match segment when query is empty.
 */
export function highlightSegments(text: string, query: string): TextSegment[] {
  if (!query.trim()) {
    return [{ text, isMatch: false }]
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)

  // Reset lastIndex after split
  regex.lastIndex = 0

  return parts
    .filter((part) => part.length > 0)
    .map((part) => {
      regex.lastIndex = 0
      return {
        text: part,
        isMatch: regex.test(part),
      }
    })
}

/**
 * Returns a plain string with the matched portion wrapped in <mark> HTML tags.
 * Safe only when rendered via dangerouslySetInnerHTML — prefer highlightSegments
 * for React rendering.
 */
export function highlightHtml(text: string, query: string): string {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(
    regex,
    '<mark class="bg-barbie-accent/30 text-barbie-text rounded px-0.5">$1</mark>',
  )
}
