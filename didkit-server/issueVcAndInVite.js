// issueVcAndInvite.js
import dotenv from 'dotenv';
dotenv.config();

import { setupAgent } from './agent.js';
import * as sdk from 'matrix-js-sdk';

const MATRIX_HOMESERVER = "https://matrix.org";

const client = sdk.createClient({
  baseUrl: MATRIX_HOMESERVER,
  accessToken: process.env.MATRIX_ACCESS_TOKEN,
  userId: process.env.MATRIX_USER_ID, // e.g. "@eastbenevolent:matrix.org"
});

async function main() {
  const agent = await setupAgent();

  const list = await agent.didManagerFind();
  if (!list.length) throw new Error('❌ DID 없음');

  const issuerDid = list[0].did;
  const invitee = process.env.MATRIX_INVITEE_ID; // ex) "@someone:matrix.org"

  // ✅ 방 생성
  const createRes = await client.createRoom({
    invite: [invitee],
    is_direct: true,
    preset: "trusted_private_chat",
    name: "VC 인증 방",
  });
  const roomId = createRes.room_id;
  console.log("📦 방 생성 완료:", roomId);

  // ✅ VC 생성
  const vc = await agent.createVerifiableCredential({
    credential: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      issuer: { id: issuerDid },
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: issuerDid,
        name: 'Alice Demo',
        role: 'tester',
        room: roomId, // ✅ 방 정보 포함
      },
    },
    proofFormat: 'jwt',
    save: true,
  });

  console.log("✅ VC 발급:\n", JSON.stringify(vc, null, 2));

  // ✅ Matrix 전송
  client.startClient();
  client.once('sync', async (state) => {
    if (state !== 'PREPARED') return;

    try {
      await client.sendMessage(roomId, {
        msgtype: "m.notice",
        body: JSON.stringify(vc, null, 2),
      });

      console.log("📤 VC 메시지 전송 완료:", roomId);
    } catch (e) {
      console.error("❌ 메시지 전송 실패:", e);
    } finally {
      client.stopClient();
    }
  });
}

main();
