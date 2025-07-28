import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { generateQR } from '../utils/qr.js'
import { inviteStore } from '../services/inviteStore.js'

const { randomUUID } = crypto

export default async function (fastify, opts) {
  fastify.post('/create-invite', async (req, res) => {
    const { room, matrixUserId } = req.body
    if (!room || !matrixUserId) {
      return res.status(400).send({ error: 'room, matrixUserId 필수' })
    }

    const token = `token_${randomUUID()}`
    const payload = { token, matrixUserId }

    // ✅ QR 코드 base64 생성
    const qrData = await generateQR(payload)

    // ✅ base64 → 버퍼로 변환
    const base64Image = qrData.replace(/^data:image\/png;base64,/, '')
    const imageBuffer = Buffer.from(base64Image, 'base64')

    // ✅ 저장 경로 및 파일 이름 설정
    const fileName = `invite_${token}.png`
    const folderPath = path.join(process.cwd(), 'public', 'invites')
    const filePath = path.join(folderPath, fileName)

    // ✅ 디렉토리 없으면 생성
    fs.mkdirSync(folderPath, { recursive: true })

    // ✅ 파일 저장
    fs.writeFileSync(filePath, imageBuffer)

    // ✅ 초대 저장소 등록
    inviteStore[token] = { room, matrixUserId, createdAt: Date.now() }

    // ✅ 응답
    return res.send({
      token,
      matrixUserId,
      qrData, // base64 형식도 유지
      qrImageUrl: `/invites/${fileName}` // 클라이언트가 직접 접근 가능
    })
  })
} 
