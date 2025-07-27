  // server.js
  import dotenv from 'dotenv'
  dotenv.config()
  import Fastify from 'fastify'
  import { setupAgent } from './agent.js'
  import { createRequire } from 'module'

  const app = Fastify({ logger: true })
  const agent = await setupAgent()
  const require = createRequire(import.meta.url)
  const { decodeJWT } = require('./decode-jwt.cjs') // ✅ OK



  // ✅ 허용된 발급자 목록
  const allowedIssuers = [
    'did:key:z6MkkH9QT9rUxnbwPRwTeatB48yrXwv5apPqXUwjZk4mnG3o'
  ]

  // 🧠 DID 자동 생성
  const dids = await agent.didManagerFind()
  if (dids.length === 0) {
    const newDid = await agent.didManagerCreate()
    console.log('🆕 새 DID 생성됨:', newDid.did)
  } else {
    console.log('✅ 기존 DID 목록:', dids.map(d => d.did))
  }

  // VC 발급
  app.post('/vc/issue', async (req, res) => {
  const { issuer, subject = {} } = req.body

  // ✅ 여기에서 vc를 사용하면 안 됨!! subject로부터 직접 추출해야 함
  const subjectId = subject.id || subject.did
  const subjectName = subject.name

  if (!subjectId || !subjectName) {
    return res
      .status(400)
      .send({ error: 'subject.id나 subject.did와 subject.name이 필요합니다.' })
  }

  try {
    const vc = await agent.createVerifiableCredential({
      credential: {
        issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: subjectId,
          name: subjectName,
        },
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
      },
      proofFormat: 'jwt',
    })

    const jwt = typeof vc === 'string' ? vc : vc?.proof?.jwt
    if (!jwt) {
      return res.status(500).send({ error: 'JWT VC 발급 실패' })
    }

    return res.send({ jwt })
  } catch (err) {
    console.error('❌ VC 발급 중 오류:', err)
    return res.status(500).send({ error: 'VC 발급 중 내부 오류', detail: err.message })
  }
})

  


  // VC 검증
  app.post('/vc/verify', async (req, res) => {
    const { credential } = req.body

    try {
      const result = await agent.verifyCredential({ credential })


      const decoded = typeof credential === 'string'
        ? decodeJWT(credential).payload
        : credential

      console.log('🧠 decoded VC:', decoded)


      const issuer = decoded.issuer || decoded.iss
      const isAllowed = allowedIssuers.includes(issuer)

      if (!isAllowed) {
        return res.send({
          verified: false,
          error: {
            code: 'UNAUTHORIZED_ISSUER',
            message: '허용되지 않은 발급자 DID입니다.',
          },
          credential: decoded,
        })
      }

      return res.send({
        verified: true,
        credential: decoded,
      })

    } catch (err) {
      return res.send({
        verified: false,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'VC 서명 검증 실패',
          detail: err.message,
        },
      })
    }
  })

  app.listen({ port: 4000 }, (err) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
    console.log('✅ Fastify server started on http://localhost:4000')
  })
