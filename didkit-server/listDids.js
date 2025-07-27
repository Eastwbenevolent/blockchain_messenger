const { setupAgent } = require('./agent')

;(async () => {
  const agent = await setupAgent()
  const list = await agent.didManagerFind()
  for (const item of list) {
    const full = await agent.didManagerGet({ did: item.did })
    console.log('DID:', full.did)
    for (const k of full.keys || []) {
      console.log('  kid:', k.kid)
      console.log('    type:', k.type, 'algo:', k.algorithm || '')
      console.log('    publicKeyHex:', k.publicKeyHex)
    }
    console.log('---')
  }
})()
