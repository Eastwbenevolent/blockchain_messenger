// matrixBot.js
import dotenv from 'dotenv'
import sdk from 'matrix-js-sdk'
import { setupAgent } from '../agent.js'
dotenv.config()

const client = sdk.createClient({
  baseUrl: 'https://matrix.org',
  accessToken: process.env.MATRIX_ACCESS_TOKEN,
  userId: process.env.MATRIX_USER_ID,
})

async function startBot() {
  const agent = await setupAgent()

  client.on('Room.timeline', async (event, room) => {
    try {
      if (event.getType() !== 'm.room.message') return
      const content = event.getContent()
      const body = content.body
      const roomId = room.roomId

      console.log('📥 수신된 VC 메시지:', body)

      let credential
      try {
        credential = JSON.parse(body)
      } catch {
        // JWT 형식이라면 그대로 사용
        if (typeof body === 'string' && body.split('.').length === 3) {
          credential = body
        } else {
          console.error('❌ VC 파싱/검증 실패: Unexpected token')
          return
        }
      }

      // ✅ VC 객체에 proof.jwt가 있다면 JWT만 추출
      if (typeof credential === 'object' && credential.proof?.jwt) {
        credential = credential.proof.jwt
      }

      try {
        const result = await agent.verifyCredential({
          credential,
        })

        if (result.verified) {
          await client.sendTextMessage(roomId, {
            msgtype: 'm.text',
            body: '✅ VC 검증 성공!',
          })
        } else {
          await client.sendTextMessage(roomId, {
            msgtype: 'm.text',
            body: '❌ VC 검증 실패: 유효하지 않은 VC입니다.',
          })
        }
      } catch (err) {
        console.error('❌ VC 검증 중 에러:', err.message)
        await client.sendTextMessage(roomId, {
          msgtype: 'm.text',
          body: `❌ VC 검증 중 에러: ${err.message}`,
        })
      }
    } catch (err) {
      console.error('❌ 메시지 처리 중 에러:', err.message)
    }
  })

  client.startClient()
  console.log('🤖 Matrix client started.')
}

startBot()
