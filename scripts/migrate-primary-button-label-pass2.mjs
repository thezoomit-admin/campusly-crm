import fs from 'fs'
import path from 'path'

const root = 'src'
const files = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(tsx|ts)$/.test(entry.name)) files.push(full)
  }
}

walk(root)

function findOpenTagEnd(source, startIdx) {
  let i = startIdx
  let quote = null
  let brace = 0
  let paren = 0
  let bracket = 0

  while (i < source.length) {
    const ch = source[i]
    const prev = i > 0 ? source[i - 1] : ''

    if (quote) {
      if (ch === quote && prev !== '\\') quote = null
      i += 1
      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch
      i += 1
      continue
    }

    if (ch === '{') brace += 1
    else if (ch === '}') brace = Math.max(0, brace - 1)
    else if (ch === '(') paren += 1
    else if (ch === ')') paren = Math.max(0, paren - 1)
    else if (ch === '[') bracket += 1
    else if (ch === ']') bracket = Math.max(0, bracket - 1)
    else if (ch === '>' && brace === 0 && paren === 0 && bracket === 0) return i
    else if (ch === '/' && source[i + 1] === '>' && brace === 0 && paren === 0 && bracket === 0) return i

    i += 1
  }
  return -1
}

let conversions = 0

function transform(content) {
  let result = ''
  let cursor = 0

  while (true) {
    const start = content.indexOf('<PrimaryButton', cursor)
    if (start === -1) {
      result += content.slice(cursor)
      break
    }

    result += content.slice(cursor, start)
    const afterName = start + '<PrimaryButton'.length
    const tagEnd = findOpenTagEnd(content, afterName)
    if (tagEnd === -1) {
      result += content.slice(start)
      break
    }

    if (content[tagEnd] === '/') {
      result += content.slice(start, tagEnd + 2)
      cursor = tagEnd + 2
      continue
    }

    const attrs = content.slice(afterName, tagEnd)
    const childrenStart = tagEnd + 1
    const closeTag = '</PrimaryButton>'
    const closeIdx = content.indexOf(closeTag, childrenStart)
    if (closeIdx === -1) {
      result += content.slice(start)
      break
    }

    const children = content.slice(childrenStart, closeIdx)
    const trimmed = children.trim()
    const nextAttrs = attrs.trimEnd()
    const space = nextAttrs.length ? (nextAttrs.endsWith('\n') ? '' : ' ') : ' '

    if (/\blabel\s*=/.test(attrs) || /\bicon\s*=/.test(attrs)) {
      result += content.slice(start, closeIdx + closeTag.length)
      cursor = closeIdx + closeTag.length
      continue
    }

    // Any single self-closing icon component as children
    const iconOnly = trimmed.match(/^<(HugeiconsIcon|HugeIcon)\b([\s\S]*)\/>$/)
    if (iconOnly) {
      conversions += 1
      result += `<PrimaryButton${nextAttrs}${space}icon={${trimmed}} />`
      cursor = closeIdx + closeTag.length
      continue
    }

    // Pure text (including ×)
    if (trimmed.length > 0 && !trimmed.includes('<') && !trimmed.includes('{')) {
      conversions += 1
      result += `<PrimaryButton${nextAttrs}${space}label="${trimmed}" />`
      cursor = closeIdx + closeTag.length
      continue
    }

    result += content.slice(start, closeIdx + closeTag.length)
    cursor = closeIdx + closeTag.length
  }

  return result
}

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8')
  if (!original.includes('</PrimaryButton>')) continue
  const next = transform(original)
  if (next !== original) {
    fs.writeFileSync(file, next)
    console.log('updated', file)
  }
}

console.log({ conversions })
