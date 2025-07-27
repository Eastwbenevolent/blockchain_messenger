// matrixBot.js

/**
 * 매트릭스 봇 실행 파일입니다. 이 파일은 Matrix 클라이언트에 접속하여 수신된
 * 메시지에서 Verifiable Credential(VC)을 추출하고 Veramo 에이전트를 통해 검증한 뒤
 * 결과를 동일한 방에 회신합니다. 검증에 성공하면 VC에 명시된 별도 방으로 자동
 * 입장하는 기능도 제공합니다.
 *
 * 환경변수 설정:
 *   - MATRIX_BASE_URL: 매트릭스 서버 주소 (기본값: https://matrix.org)
 *   - MATRIX_ACCESS_TOKEN: 매트릭스 액세스 토큰 (필수)
 *   - MATRIX_USER_ID: 매트릭스 사용자 ID (필수)
 *   - DB_ENCRYPTION_KEY: Veramo 데이터베이스 암호화 키 (필수, agent.js에서 사용)
 */

import dotenv from 'dotenv'
import sdk from 'matrix-js-sdk'
import { setupAgent } from './agent.js'

dotenv.config()

const MATRIX_BASE_URL = process.env.MATRIX_BASE_URL || 'https://matrix.org'
const MATRIX_ACCESS_TOKEN = process.env.MATRIX_ACCESS_TOKEN
const MATRIX_USER_ID = process.env.MATRIX_USER_ID

if (!MATRIX_ACCESS_TOKEN || !MATRIX_USER_ID) {
  throw new Error(
    'MATRIX_ACCESS_TOKEN 또는 MATRIX_USER_ID 환경변수가 설정되지 않았습니다. 매트릭스 봇을 실행할 수 없습니다.',
  )
}

// 하나의 Matrix 클라이언트 인스턴스를 생성합니다.
const client = sdk.createClient({
  baseUrl: MATRIX_BASE_URL,
  accessToken: MATRIX_ACCESS_TOKEN,
  userId: MATRIX_USER_ID,
})

/**
 * 방에 입장하는 도우미 함수입니다. roomId가 없거나 이미 입장한 경우 무시합니다.
 * @param {string|undefined} roomId
 */
async function joinRoom(roomId) {
  if (!roomId) return
  try {
    await client.joinRoom(roomId)
    console.log('🚪 방 입장 성공:', roomId)
  } catch (err) {
    console.error('❌ 방 입장 실패:', err.message || err)
  }
}

/**
 * 메시지 본문에서 VC 또는 JWT를 추출합니다.
 * - JSON 파싱을 시도하여 실패하면 body가 점(`.`)이 2개 있는 JWT인지 확인하여 그대로 반환합니다.
 * - 객체 형태의 VC의 경우 proof.jwt 값이 존재하면 JWT만 반환합니다.
 * @param {string} body
 * @returns {any}
 */
function extractCredentialFromBody(body) {
  let credential
  try {
    credential = JSON.parse(body)
  } catch (e) {
    // JWT 형식(점이 2개)인지 확인
    if (typeof body === 'string' && body.split('.').length === 3) {
      return body
    }
    throw new Error('메시지를 JSON 또는 JWT로 파싱할 수 없습니다.')
  }
  // VC 객체에 proof.jwt 속성이 있으면 JWT만 사용
  if (typeof credential === 'object' && credential.proof?.jwt) {
    return credential.proof.jwt
  }
  return credential
}

/**
 * 주어진 페이로드가 W3C VC인지 단순히 검사합니다. @context와 type이 배열일 수도 있으므로
 * 문자열과 배열을 모두 처리합니다.
 * @param {any} payload
 */
function looksLikeVC(payload) {
  const ctx = payload['@context']
  const type = payload.type
  const hasContext = Array.isArray(ctx)
    ? ctx.includes('https://www.w3.org/2018/credentials/v1')
    : ctx === 'https://www.w3.org/2018/credentials/v1'
  const hasType = Array.isArray(type) ? type.includes('VerifiableCredential') : type === 'VerifiableCredential'
  return Boolean(hasContext && hasType)
}

/**
 * Bot 실행 함수. Veramo 에이전트를 초기화한 뒤 Matrix 메시지를 처리합니다.
 */
async function startBot() {
  const agent = await setupAgent()
  console.log('✅ Veramo agent 초기화 완료')

  client.on('Room.timeline', async (event, room) => {
  if (event.getType() !== 'm.room.message') return

  const content = event.getContent()
  const body = content.body
  const roomId = room.roomId

  console.log('📥 수신된 VC 메시지:', body)

  // 🔍 1. VC 형식 판별 (string or JSON)
  let credential
  try {
    credential = JSON.parse(body)
  } catch {
    // JWT일 경우
    if (typeof body === 'string' && body.split('.').length === 3) {
      credential = body
    } else {
      return
    }
  }

  try {
    // 🔗 2. Fastify 서버에 검증 요청
    const res = await fetch('http://localhost:4000/vc/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    })

    const result = await res.json()

    // 🟢/🔴 3. 검증 결과 전송
    const verified = result.verified
    const msg = verified
      ? '✅ Verifiable Credential 검증 성공!'
      : `❌ VC 검증 실패: ${result.error?.message || '알 수 없음'}`

    await client.sendTextMessage(roomId, msg)
  } catch (err) {
    console.error('❌ VC 검증 중 에러:', err)
    await client.sendTextMessage(roomId, '❌ VC 검증 중 오류가 발생했습니다.')
  }
})


  // Matrix 클라이언트 시작
  await client.startClient()
  console.log('🤖 Matrix client started.')
}

// 봇 시작
startBot().catch((err) => {
  console.error('봇 실행 중 오류가 발생했습니다:', err)
})