import fastifyOauth2 from '@fastify/oauth2';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

async function googleAuthPlugin(fastify: FastifyInstance) {
  fastify.register(fastifyOauth2, {
    name: 'googleOAuth2',
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID!,
        secret: process.env.GOOGLE_CLIENT_SECRET!,
      },
	  auth: (fastifyOauth2 as any).GOOGLE_CONFIGURATION
    },
    startRedirectPath: '/api/users/login/google',
    callbackUri: process.env.GOOGLE_CALLBACK_URL!,
    scope: ['profile', 'email'],
  });
}

export default fp(googleAuthPlugin);

