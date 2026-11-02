import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const roots = ['frontend/src', 'frontend/public', 'backend/src'].map((root) => path.resolve(root))
const cp1252 = new Map([[402,131],[8364,128],[8218,130],[8222,132],[8230,133],[8224,134],[8225,135],[710,136],[8240,137],[352,138],[8249,139],[338,140],[381,142],[8216,145],[8217,146],[8220,147],[8221,148],[8226,149],[8211,150],[8212,151],[732,152],[8482,153],[353,154],[8250,155],[339,156],[382,158],[376,159]])
const tokenPattern = /[\p{L}\p{N}\u0080-\u00ff\u0192\u2000-\u206f]+/gu
const badMarker = /[\u00c3\u00c2\u00e2]/u
let changedFiles = 0

function repair(token) {
  if (!badMarker.test(token)) return token
  let current = token
  for (let pass = 0; pass < 6; pass += 1) {
    const bytes = []
    for (const character of current) {
      const code = character.codePointAt(0)
      if (code <= 255) bytes.push(code)
      else if (cp1252.has(code)) bytes.push(cp1252.get(code))
      else return current
    }
    let decoded
    try {
      decoded = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bytes))
    } catch {
      return current
    }
    if (decoded === current || decoded.includes('\uFFFD')) return current
    current = decoded
    if (!badMarker.test(current)) break
  }
  return current
}

function walk(directory) {
  if (!fs.existsSync(directory)) return
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(file)
    else if (/\.(vue|ts|css|html|js|json)$/.test(entry.name)) {
      const original = fs.readFileSync(file, 'utf8')
      const fixed = original.replace(tokenPattern, repair)
      if (fixed !== original) {
        fs.writeFileSync(file, fixed, 'utf8')
        changedFiles += 1
      }
    }
  }
}

for (const root of roots) walk(root)
console.log(`Fixed encoding in ${changedFiles} files.`)
