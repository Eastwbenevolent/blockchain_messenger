// createRoom.js
import dotenv from 'dotenv';
dotenv.config();

import { setupAgent } from './agent.js';
import * as sdk from 'matrix-js-sdk';

const client = sdk.createClient({
  baseUrl: 'https://matrix.org',
  accessToken: process.env.MATRIX_ACCESS_TOKEN,
  userId: '@eastbenevolent:matrix.org',
});

async function main() {
  await client.startClient();
  await new Promise(resolve => client.once('sync', resolve)); // sync 완료 대기

  // ✅ 방 생성
  const { room_id } = await client.createRoom({
    visibility: 'private',
    invite: [process.env.TARGET_USER_ID], // 예: "@bob:matrix.org"
    name: "VC 인증방",
  });

  console.log("✅ 방 생성:", room_id);

  const agent = await setupAgent();
  const did = (await agent.didManagerFind())[0]?.did;

  // ✅ VC 발급
  const vc = await agent.createVerifiableCredential({
    credential: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      issuer: { id: did },
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: did,
        name: 'Bob',
        role: 'invitee',
        room: room_id, // 초대한 방 ID 삽입
      },
    },
    proofFormat: 'jwt',
  });

  // ✅ VC 메시지 전송
  await client.sendMessage(room_id, {
    msgtype: 'm.notice',
    body: JSON.stringify(vc, null, 2),
  });

  console.log('📤 VC 메시지 전송 완료');
  client.stopClient();
}

main();
