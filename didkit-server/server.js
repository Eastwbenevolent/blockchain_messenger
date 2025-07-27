import Fastify from 'fastify'
import dotenv from 'dotenv'
dotenv.config()

import { setupAgent } from './agent.js'

const app = Fastify({ logger: true })
const agent = await setupAgent()

// ✅ 에이전트가 관리하는 DID 없으면 하나 자동 생성
const dids = await agent.didManagerFind()
if (dids.length === 0) {
  const newDid = await agent.didManagerCreate()
  console.log('🆕 새 DID 생성됨:', newDid.did)
} else {
  console.log('✅ 기존 DID 목록:', dids.map(d => d.did))
}

app.post('/vc/issue', async (req, res) => {
  const { issuer, subject } = req.body
  const credential = await agent.createVerifiableCredential({
    credential: {
      issuer,
      issuanceDate: new Date().toISOString(),
      credentialSubject: subject,
    },
    proofFormat: 'jwt',
  })
  return credential
})

app.post('/vc/verify', async (req, res) => {
  const { credential } = req.body
  const result = await agent.verifyCredential({ credential })
  return result
})

app.listen({ port: 4000 }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  console.log('✅ Fastify server started on http://localhost:4000')
})
