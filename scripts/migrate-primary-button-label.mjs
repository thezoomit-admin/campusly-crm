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

let changedFiles = 0
let conversions = 0

function transform(content) {
  const re = /<PrimaryButton\b([\s\S]*?)>([\s\S]*?)<\/PrimaryButton>/g

  return content.replace(re, (full, attrs, children) => {
    const trimmed = children.trim()
    if (/\blabel\s*=/.test(attrs)) return full

    const nextAttrs = attrs.trimEnd()
    const space = nextAttrs.length ? (nextAttrs.endsWith('\n') ? '' : ' ') : ' '

    // Pure text children
    if (/^[^<{]*$/.test(trimmed) && trimmed.length > 0) {
      conversions += 1
      const label = trimmed.replace(/\s+/g, ' ')
      return `<PrimaryButton${nextAttrs}${space}label="${label}" />`
    }

    // Simple expression children: {expr}
    const exprMatch = trimmed.match(/^\{([\s\S]+)\}$/)
    if (exprMatch && !trimmed.includes('<')) {
      conversions += 1
      return `<PrimaryButton${nextAttrs}${space}label={${exprMatch[1].trim()}} />`
    }

    // Icon-only children
    if (/^<HugeiconsIcon\b[\s\S]*\/>$/.test(trimmed) && !/\bicon\s*=/.test(attrs)) {
      conversions += 1
      return `<PrimaryButton${nextAttrs}${space}icon={${trimmed}} />`
    }

    // Complex JSX children -> label={<>...</>}
    if (trimmed.includes('<') || trimmed.includes('{')) {
      conversions += 1
      return `<PrimaryButton${nextAttrs}${space}label={<>${trimmed}</>} />`
    }

    return full
  })
}

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8')
  if (!original.includes('PrimaryButton')) continue
  const next = transform(original)
  if (next !== original) {
    fs.writeFileSync(file, next)
    changedFiles += 1
    console.log('updated', file)
  }
}

console.log(JSON.stringify({ changedFiles, conversions }, null, 2))
