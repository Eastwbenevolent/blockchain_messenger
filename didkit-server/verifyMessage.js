const { setupAgent } = require('./agent')
const nacl = require('tweetnacl')

function b64urlToB64(s) {
  return s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')
}

const DID = process.argv[2]
const MSG = process.argv[3]
const SIG = process.argv[4]

if (!DID || !MSG || !SIG) {
  console.error('사용법: node verifyMessage.js <DID> "<message>" <signatureBase64Url>')
  process.exit(1)
}

;(async () => {
  const agent = await setupAgent()
  const doc = await agent.didManagerGet({ did: DID })
  const key = (doc.keys || [])[0]
  const ok = nacl.sign.detached.verify(
    Buffer.from(MSG, 'utf8'),
    Buffer.from(b64urlToB64(SIG), 'base64'),
    Buffer.from(key.publicKeyHex, 'hex'),
  )
  console.log('verified:', ok)
})()
