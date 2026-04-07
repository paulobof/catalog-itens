export interface TextSegment {
  text: string
  isMatch: boolean
}

export function highlightSegments(text: string, query: string): TextSegment[] {
  if (!query.trim()) {
    return [{ text, isMatch: false }]
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)

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

export function highlightHtml(text: string, query: string): string {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(
    regex,
    '<mark class="bg-barbie-accent/30 text-barbie-text rounded px-0.5">$1</mark>',
  )
}
