// server.js
import Fastify from 'fastify';
import acceptInviteRoute from './routes/acceptInvite.js';
import createInviteRoute from './routes/createInvite.js';
import issueVCRoute from './routes/issueVC.js';
import fastifyStatic from '@fastify/static'
import path from 'path'

const app = Fastify({ logger: true });

app.register(acceptInviteRoute);
app.register(createInviteRoute);
app.register(issueVCRoute);
app.register(fastifyStatic, {
  root: path.join(process.cwd(), 'public'),
  prefix: '/',  // localhost:4000/invites/~~ 가능하게
})

app.listen({ port: 4000 }, err => {
  if (err) throw err;
  console.log('🚀 Server running at http://localhost:4000');
});

