// check-i18n.mjs — keeps English and Arabic in step.
//
//   node scripts/check-i18n.mjs
//
// Fails (exit 1) when:
//  1. a key exists in English but not in Arabic, or the other way round;
//  2. a page calls t('some.key') and the key is defined in neither language.
//
// No dependencies: it reads the source files as text.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const langFile = path.join(root, 'src/context/LanguageContext.tsx')
const text = fs.readFileSync(langFile, 'utf8')

const split = text.indexOf('\n  ar: {')
if (split < 0) {
  console.error('Could not find the "ar:" block in LanguageContext.tsx')
  process.exit(1)
}
const keyPattern = /^\s*'([A-Za-z0-9_.]+)'\s*:/gm
const keysOf = (block) => new Set([...block.matchAll(keyPattern)].map((m) => m[1]))
const en = keysOf(text.slice(0, split))
const ar = keysOf(text.slice(split))

const problems = []
for (const k of en) if (!ar.has(k)) problems.push(`missing in Arabic: ${k}`)
for (const k of ar) if (!en.has(k)) problems.push(`missing in English: ${k}`)

const used = new Map()
const walk = (dir) => {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name)
    if (f.isDirectory()) walk(p)
    else if (/\.tsx?$/.test(f.name) && p !== langFile) {
      const src = fs.readFileSync(p, 'utf8')
      for (const m of src.matchAll(/\bt\(\s*'([a-z_]+\.[A-Za-z0-9_.]+)'/g)) if (!used.has(m[1])) used.set(m[1], path.relative(root, p))
    }
  }
}
walk(path.join(root, 'src'))
for (const [k, file] of used) if (!en.has(k) && !ar.has(k)) problems.push(`used but not defined: ${k}  (${file})`)

console.log(`English keys: ${en.size}, Arabic keys: ${ar.size}, keys used in code: ${used.size}`)
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`)
  for (const p of problems) console.error('  - ' + p)
  process.exit(1)
}
console.log('i18n OK')
