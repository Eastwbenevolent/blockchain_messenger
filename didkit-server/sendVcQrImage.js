import fs from 'fs'
import path from 'path'
import mime from 'mime-types'
import * as sdk from 'matrix-js-sdk'
import dotenv from 'dotenv'
dotenv.config()

const client = sdk.createClient({
  baseUrl: "https://matrix.org",
  accessToken: process.env.MATRIX_ACCESS_TOKEN,
  userId: "@eastbenevolent:matrix.org",
})

const roomId = process.env.MATRIX_ROOM_ID // 환경변수에 채팅방 ID도 넣어줘

async function sendImage() {
  const imagePath = './vc_qr.png'
  const imageData = fs.readFileSync(imagePath)
  const mimeType = mime.lookup(imagePath) || 'image/png'

  // ✅ 1. 이미지 업로드
  const uploadRes = await client.uploadContent(imageData, {
    name: path.basename(imagePath),
    type: mimeType,
    rawResponse: false,
    onlyContentUri: false,
  })

  console.log("✅ 이미지 업로드 완료:", uploadRes.content_uri)

  // ✅ 2. m.image 메시지 전송
  const imageMessage = {
    body: path.basename(imagePath),
    msgtype: "m.image",
    url: uploadRes.content_uri,
    info: {
      mimetype: mimeType,
      size: imageData.length,
    },
  }

  await client.sendMessage(roomId, imageMessage)
  console.log("📤 Matrix로 QR 이미지 전송 완료!")
}

// 시작
client.startClient()
client.once('sync', async (state) => {
  if (state === 'PREPARED') {
    await sendImage()
    client.stopClient()
  }
})
