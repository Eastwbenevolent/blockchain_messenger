const { setupAgent } = require('./agent')
const DID = process.argv[2]
const KID = process.argv[3]
const MSG = process.argv[4] || 'hello veramo'

if (!DID || !KID) {
  console.error('사용법: node signMessage.js <DID> <KID> "message"')
  process.exit(1)
}

;(async () => {
  const agent = await setupAgent()
  const sigB64 = await agent.keyManagerSign({
    keyRef: KID,
    data: MSG,
    encoding: 'utf-8',
    algorithm: 'Ed25519',
  })
  console.log('did:', DID)
  console.log('kid:', KID)
  console.log('message:', MSG)
  console.log('signature(base64):', sigB64)
})()
