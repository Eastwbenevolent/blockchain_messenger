import dotenv from 'dotenv'
dotenv.config()
import * as sdk from 'matrix-js-sdk';

import Fastify from 'fastify'
import cors from '@fastify/cors'
import sensible from 'fastify-sensible'
import nacl from 'tweetnacl'
import { setupAgent } from './agent.js'

const agentPromise = setupAgent();

const client = sdk.createClient({
  baseUrl: "https://matrix.org",
  accessToken: process.env.MATRIX_ACCESS_TOKEN,
  userId: "@eastbenevolent:matrix.org",
});

async function joinRoomHelper(roomId) {
  if (!roomId) return;
  try {
    await client.joinRoom(roomId);
    console.log("🚪 방 입장 성공:", roomId);
  } catch (e) {
    console.error("❌ 방 입장 실패:", e.message || e);
  }
}

client.on("Room.timeline", async (event, room) => {
  if (event.getType() !== "m.room.message") return;
  if (event.getSender() === client.getUserId()) return;

  const content = event.getContent();
  const body = content?.body;
  console.log("📥 수신 메시지:", body);

  if (!body || typeof body !== "string") return;

  let payload;
  try {
    payload = JSON.parse(body);
    console.log("📦 JSON 파싱 결과:", payload);
  } catch (e) {
    console.log("❌ JSON 파싱 실패");
    return;
  }

  const isVC =
    payload['@context']?.includes('https://www.w3.org/2018/credentials/v1') &&
    payload.type?.includes('VerifiableCredential');

  if (!isVC) {
    console.log("❌ 메시지가 VC 형식이 아님");
    return;
  }

  const agent = await agentPromise;
  let resultText = '';
  let verified = false;

  try {
    await agent.verifyCredential({ credential: payload });
    console.log("🔐 Veramo 검증 성공");
    verified = true;

  const roomId = payload.credentialSubject?.room;
  await joinRoomHelper(roomId);

    resultText = `✅ VC verified\n- issuer: ${payload.issuer?.id || payload.issuer}\n- subject: ${payload.credentialSubject?.id}`;
  } catch (e) {
    console.error("❌ Veramo 검증 실패:", e.message);
    resultText = `❌ VC verification failed\n- reason: ${e.message}`;
  }

  await client.sendMessage(room.roomId, {
    msgtype: "m.notice",
    body: resultText,
  });

  console.log("📤 회신 완료:", resultText);

  // ✅ 방 자동 입장 로직
  if (verified && payload.credentialSubject?.room) {
    await joinRoomHelper(payload.credentialSubject.room);
  }
});

client.startClient().then(() => {
  console.log("🚀 Matrix client started.");
});
