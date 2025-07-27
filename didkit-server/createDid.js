const { setupAgent } = require('./agent')

;(async () => {
  const agent = await setupAgent()
  const id = await agent.didManagerCreate()
  console.log('DID:', id.did)
  console.log('kid:', id.controllerKeyId || (id.keys && id.keys[0] && id.keys[0].kid))
})()
