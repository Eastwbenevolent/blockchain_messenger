// routes/acceptInvite.js
import { inviteStore } from '../services/inviteStore.js'
import { setupAgent } from '../agent.js'

export default async function acceptInviteRoute(app, opts) {
  const agent = await setupAgent()

  app.post('/accept-invite', async (req, res) => {
    const { token, user } = req.body
    if (!token || !user?.did || !user?.name) {
      return res.status(400).send({ error: 'token, user.did, user.name 필수' })
    }

    const invite = inviteStore[token]
    if (!invite) {
      return res.status(404).send({ error: '해당 token에 대한 초대가 존재하지 않습니다.' })
    }

    const issuer = (await agent.didManagerGetOrCreate({ alias: 'default' })).did

    const vc = await agent.createVerifiableCredential({
      credential: {
        issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: user.did,
          name: user.name,
          room: invite.room,
        },
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'InviteVC'],
      },
      proofFormat: 'jwt',
    })

    await client.invite(invite.room, invite.matrixUserId)

    return res.send({
      room: invite.room,
      vc: typeof vc === 'string' ? vc : vc.proof.jwt,
    })
  })
}
