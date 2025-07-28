// services/vcService.js
import QRCode from 'qrcode';
import { setupAgent } from '../agent.js'
export async function createInvitationVC({ issuer, subjectId, subjectUserId, roomId, token }) {
  const agent = await setupAgent();

  
  const vc = await agent.createVerifiableCredential({
    credential: {
      issuer,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: subjectId,
        userId: subjectUserId,
        room: roomId,
        token
      },
      type: ['VerifiableCredential', 'Invitation'],
      '@context': ['https://www.w3.org/2018/credentials/v1']
    },
    proofFormat: 'jwt'
  });

  const jwt = typeof vc === 'string' ? vc : vc.proof.jwt;
  const qrDataUrl = await QRCode.toDataURL(jwt);
  return { jwt, qrDataUrl };
}
