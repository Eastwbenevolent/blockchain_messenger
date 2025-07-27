const { setupAgent } = require('./agent')
const fs = require('fs')

function readTextSmart(path) {
  const buf = fs.readFileSync(path)
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return buf.toString('utf16le')
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) return buf.swap16().toString('utf16le')
  let text = buf.toString('utf8')
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  while (text.length && text.charCodeAt(0) < 0x20 && !'\r\n\t '.includes(text[0])) text = text.slice(1)
  return text
}

;(async () => {
  const agent = await setupAgent()
  const raw = readTextSmart('./vc.json').trim()
  const credential = raw.startsWith('{') ? JSON.parse(raw) : raw.replace(/^"+|"+$/g, '')
  const res = await agent.verifyCredential({ credential })
  console.log(res)
})().catch((e) => {
  console.error('verifyCredential error:', e)
  process.exit(1)
})
