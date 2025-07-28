// routes/issueVC.js
import { createInvitationVC } from '../services/vcService.js';

export default async function issueVCRoute(app, opts) {
  app.post('/vc/issue', async (req, res) => {
    const { issuer, subject = {} } = req.body;
    const subjectId = subject.id || subject.did;
    const subjectName = subject.name || '이름 없음';
    const subjectRoom = subject.room || '방 없음';

    if (!subjectId || !subjectName) {
      return res.status(400).send({ error: 'subject.id, name required' });
    }

    const { jwt, qrDataUrl } = await createInvitationVC({
      issuer,
      subjectId,
      subjectUserId: subject.userId || 'unknown',
      roomId: subjectRoom,
      token: 'manual_issue'
    });

    return res.send({ jwt, qrDataUrl });
  });
}
