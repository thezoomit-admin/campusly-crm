import fs from 'fs'

const content = fs.readFileSync('src/modules/users/pages/UsersPage.tsx', 'utf8')
const start = content.indexOf('<PrimaryButton type="button" className={`${modalClose}`}')
console.log('start', start)
console.log('---snippet---')
console.log(content.slice(start, start + 400))

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

const after = start + '<PrimaryButton'.length
const tagEnd = findOpenTagEnd(content, after)
console.log('tagEnd', tagEnd, 'char', JSON.stringify(content[tagEnd]))
console.log('attrs', JSON.stringify(content.slice(after, tagEnd)))
const closeIdx = content.indexOf('</PrimaryButton>', tagEnd + 1)
const children = content.slice(tagEnd + 1, closeIdx)
console.log('children', JSON.stringify(children))
console.log('icon match', /^<(HugeiconsIcon|HugeIcon)\b([\s\S]*)\/>$/.test(children.trim()))
