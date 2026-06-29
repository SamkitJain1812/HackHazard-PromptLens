export function isValidNaturalLanguageQuery(input) {
  const text = String(input || '').trim()
  if (text.length < 6) return false

  // Must contain letters
  const letters = (text.match(/[a-z]/gi) || []).length
  if (letters < 3) return false

  // Too much gibberish punctuation/symbols
  const weird = (text.match(/[^a-z0-9\s,'".!?()-]/gi) || []).length
  if (weird / Math.max(text.length, 1) > 0.25) return false

  // Repeated same character (e.g. "aaaaaa", "!!!!!!")
  if (/(.)\1{5,}/.test(text)) return false

  // "one word" is often too ambiguous; allow if it's a known keyword-ish length
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 1 && words[0].length < 10) return false

  return true
}

