// signMessage.js

/**
 * Veramo 에이전트를 통해 임의 메시지에 Ed25519 서명을 생성하는 유틸리티입니다.
 * 사용법:
 *   node ./didkit-server/signMessage.js <did> <kid> "메시지 내용"
 *
 * <did>   : 서명을 생성할 DID
 * <kid>   : DID에 대응되는 키 식별자(KID)
 * <메시지>: 서명할 메시지 문자열 (공백을 포함하는 경우 따옴표로 묶어야 함)
 *
 * 환경변수 DB_ENCRYPTION_KEY가 설정되어 있어야 에이전트가 초기화됩니다.
 */

import { setupAgent } from './agent.js'

async function main() {
  const [, , did, kid, ...rest] = process.argv
  const message = rest.join(' ') || 'hello veramo'

  if (!did || !kid) {
    console.error(
      '사용법: node ./didkit-server/signMessage.js <did> <kid> "메시지 내용>"',
    )
    process.exit(1)
  }

  try {
    const agent = await setupAgent()
    const signature = await agent.keyManagerSign({
      keyRef: kid,
      data: message,
      encoding: 'utf-8',
      algorithm: 'Ed25519',
    })
    console.log('did:', did)
    console.log('kid:', kid)
    console.log('message:', message)
    console.log('signature(base64):', signature)
  } catch (err) {
    console.error('서명 생성 중 오류 발생:', err.message || err)
    process.exit(1)
  }
}

main()