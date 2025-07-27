// generateVcQr.js
import fs from 'fs'
import qrcode from 'qrcode'
import dotenv from 'dotenv'
dotenv.config()

// 발급된 VC를 불러온다고 가정 (issueVc.js에서 출력된 VC)
const vc = {
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  type: ["VerifiableCredential"],
  issuer: { id: "did:key:..." },
  issuanceDate: new Date().toISOString(),
  credentialSubject: {
    id: "did:key:...",
    name: "Alice Demo",
    role: "tester"
  },
  proof: {
    type: "JwtProof2020",
    jwt: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9..." // 실제 VC JWT로 교체
  }
}

async function main() {
  const jsonString = JSON.stringify(vc)
  const qrPath = './vc_qr.png'

  try {
    await qrcode.toFile(qrPath, jsonString)
    console.log(`✅ QR 코드 생성 완료: ${qrPath}`)
  } catch (e) {
    console.error('❌ QR 생성 실패:', e)
  }
}

main()
