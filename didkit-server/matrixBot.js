// matrixBot.js

/**
 * 매트릭스 봇 실행 파일입니다. 이 파일은 Matrix 클라이언트에 접속하여 수신된
 * 메시지에서 Verifiable Credential(VC)을 추출하고 Veramo 에이전트를 통해 검증한 뒤
 * 결과를 동일한 방에 회신합니다. 검증에 성공하면 VC에 명시된 별도 방으로 자동
 * 입장하는 기능도 제공합니다.
 */

import dotenv from 'dotenv'
import sdk from 'matrix-js-sdk'
import { setupAgent } from './agent.js'

dotenv.config()

const MATRIX_BASE_URL = process.env.MATRIX_BASE_URL || 'https://matrix.org'
const MATRIX_ACCESS_TOKEN = process.env.MATRIX_ACCESS_TOKEN
const MATRIX_USER_ID = process.env.MATRIX_USER_ID

if (!MATRIX_ACCESS_TOKEN || !MATRIX_USER_ID) {
  throw new Error('❌ MATRIX_ACCESS_TOKEN 또는 MATRIX_USER_ID 환경변수가 설정되지 않았습니다.')
}

// Matrix 클라이언트 생성
const client = sdk.createClient({
  baseUrl: MATRIX_BASE_URL,
  accessToken: MATRIX_ACCESS_TOKEN,
  userId: MATRIX_USER_ID,
})

// 방 입장 함수
async function joinRoom(roomId) {
  if (!roomId) return
  try {
    await client.joinRoom(roomId)
    console.log('🚪 방 입장 성공:', roomId)
  } catch (err) {
    console.error('❌ 방 입장 실패:', err.message || err)
  }
}

// 메시지에서 VC 추출
function extractCredentialFromBody(body) {
  if (typeof body === 'string') {
    const cleaned = body
      .replace(/\s+/g, '')         // ✅ 줄바꿈 포함 모든 공백 제거
      .replace(/^"|"$/g, '')       // ✅ 감싸는 따옴표 제거

    if (cleaned.split('.').length === 3) {
      return cleaned
    } else {
      console.error('❌ JWT 형식 아님:', cleaned)
    }
  }

  try {
    const parsed = JSON.parse(body)
    if (parsed?.proof?.jwt) return parsed.proof.jwt
    throw new Error('VC 객체에 proof.jwt가 없음')
  } catch (e) {
    throw new Error('메시지를 JSON 또는 JWT로 파싱할 수 없습니다.')
  }
}


// VC 여부 단순 검사
function looksLikeVC(payload) {
  const ctx = payload['@context']
  const type = payload.type
  const hasContext = Array.isArray(ctx)
    ? ctx.includes('https://www.w3.org/2018/credentials/v1')
    : ctx === 'https://www.w3.org/2018/credentials/v1'
  const hasType = Array.isArray(type)
    ? type.includes('VerifiableCredential')
    : type === 'VerifiableCredential'
  return hasContext && hasType
}

// Bot 실행
// matrixBot.js

async function startBot() {
  const agent = await setupAgent()
  console.log('✅ Veramo agent 초기화 완료')

  client.on('Room.timeline', async (event, room) => {
  try {
    if (event.getType() !== 'm.room.message') return;
    const content = event.getContent();
    const body = content.body;
    const roomId = room.roomId;

    // JWT 감지
    if (typeof body === 'string' && body.split('.').length === 3) {
      const result = await agent.verifyCredential({ credential: body });
      const vc = result.verifiableCredential || JSON.parse(Buffer.from(body.split('.')[1], 'base64').toString());

      const issuer = vc.issuer || vc.iss;
      const subjectDid = vc.credentialSubject?.id || vc.sub;
      const targetRoom = vc.credentialSubject?.room;

      if (!allowedIssuers.includes(issuer)) {
        return client.sendTextMessage(roomId, '❌ 허용되지 않은 발급자입니다.');
      }

      if (targetRoom) {
        await client.joinRoom(targetRoom);
        await client.sendTextMessage(targetRoom, `🎉 ${vc.credentialSubject?.name || subjectDid} 님이 인증되어 입장했습니다.`);
      }

      const types = Array.isArray(vc.type) ? vc.type.filter(t => t !== 'VerifiableCredential').join(', ') : 'N/A';
      const issuedAt = new Date(vc.issuanceDate || vc.nbf * 1000).toLocaleString('ko-KR');

      const msg = [
        '✅ [VC 검증 완료]',
        `발급자 DID: ${issuer}`,
        `대상자 DID: ${subjectDid}`,
        `VC 종류: ${types}`,
        `발급일: ${issuedAt}`,
        '',
        '🎉 이 증명서는 유효하며 신뢰할 수 있습니다.'
      ].join('\n');

      await client.sendTextMessage(roomId, msg);
    }
  } catch (err) {
    console.error('❌ VC 검증 에러:', err);
    await client.sendTextMessage(room.roomId, '❌ VC 검증 실패: ' + err.message);
  }
});


  // ✅ 리스너 등록 후, 여기서 클라이언트 시작
  await client.startClient()
  console.log('🤖 Matrix client started.')
}


startBot().catch((err) => {
  console.error('봇 실행 중 오류가 발생했습니다:', err)
})
