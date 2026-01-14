import Fastify from 'fastify'
import cors from '@fastify/cors';
import { 
  serializerCompiler, 
  validatorCompiler, 
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { userPrivateRoutes, userPublicRoutes } from './routes/user/user.route.js'
import prismaPlugin from './plugins/prisma.plugin.js';
import { registerSwagger, registerSwaggerUi } from './registers/swagger.register.js';
import { userController } from './routes/user/user.controller.js'
import { gamePrivateRoutes } from './routes/game/game.route.js';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import fastifyWebsocket from '@fastify/websocket';
import { friendsPrivateRoutes } from './routes/friends/friends.route.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { tournamentPrivateRoutes } from './routes/tournaments/tournament.route.js';
import { wsPrivateRoutes } from './routes/websockets/ws.routes.js';
import type { FastifyCookieOptions } from '@fastify/cookie'
import cookie from '@fastify/cookie'
import { chatPrivateRoutes } from './routes/chat/chat.route.js';
import oauth2 from '@fastify/oauth2';
import { userService } from './routes/user/user.service.js';
import type { CreateUserData } from './routes/user/user.schema.js';

declare module 'fastify' {
  interface FastifyInstance {
    googleOAuth2: import('@fastify/oauth2').OAuth2Namespace;
  }
}

const fastify = Fastify({
  logger: true,
  trustProxy: true
}).withTypeProvider<ZodTypeProvider>();

await fastify.register(cookie, {
	secret: "my-secret",
} as FastifyCookieOptions)

await fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

await fastify.register(oauth2, {
	name: 'googleOAuth2',
	scope: ['profile', 'email'],
	credentials: {
		client: { id: '98652351612-mmn1ig2j8hqhqpkamcqhctv184e8oc7j.apps.googleusercontent.com', secret: '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' },
		auth: {
			authorizeHost: 'https://accounts.google.com',
			authorizePath: '/o/oauth2/v2/auth',
			tokenHost: 'https://oauth2.googleapis.com',
			tokenPath: '/token'
		}
	},
	cookie: {
    	path: '/',
    	sameSite: 'lax',
    	secure: false, 
		httpOnly: true
  	},
	
	startRedirectPath: '/login/google',
	callbackUri: 'http://localhost:3000/login/google/callback'
})

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

await registerSwagger(fastify);
await registerSwaggerUi(fastify);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

fastify.register(fastifyStatic, {
	root: path.join(__dirname, '../uploads'),
	prefix: '/uploads/',
})

fastify.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/uploads/')) {
		return reply.sendFile('default.jpg', path.join(__dirname, '../uploads/avatars'))
    }
    return reply.code(404).send({ error: 'Route not found' })
})

fastify.register(fastifyWebsocket)
fastify.register(fastifyMultipart, { attachFieldsToBody: true, limits: { fileSize: 10 * 1024 * 1024 }})
fastify.register(prismaPlugin);

fastify.register(userPublicRoutes, { prefix: "/api/users" });

fastify.get('/login/google/callback', async (request, reply) => {
	try {
		const { token } = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
		
		const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
			headers: {
				Authorization: `Bearer ${token.access_token}`
			}
		});

		const userData = await userResponse.json();

		let newUser;
		const user = await userService.findUserByEmail(request.server.prisma, {email: userData.email} );
		if (!user) {
			newUser = await userService.createUser(request.server.prisma, {
				email: userData.email,
				name: userData.name,
				password: userData.id,
				surname: userData.family_name,
				displayName: userData.given_name,
				avatarUrl: userData.picture,
			} as CreateUserData);
		}
		
		const session = await userService.createSession(request.server.prisma, newUser.id);
		const isProduction = process.env.NODE_ENV === 'production';
		reply.setCookie('sessionId', session.id, {
			httpOnly: true,
			secure: isProduction,
			sameSite: isProduction ? 'none' : 'lax',
			path: '/',
			maxAge: 60 * 60 * 24,
		})
		return reply.redirect('http://localhost:5173/home');
	} catch (err) {
		console.log(err);
		reply.send(err);
	}
});

fastify.register(async (protectedRoutes) => {
	protectedRoutes.addHook('preHandler', async (request, reply) => await userController.protectedRouteHandler(request, reply));
	
	// HTTP routes
	protectedRoutes.register(userPrivateRoutes, { prefix: "/api/users" })
	protectedRoutes.register(gamePrivateRoutes, { prefix: "/api/games" })
	protectedRoutes.register(tournamentPrivateRoutes, { prefix: "/api/tournaments" })
	protectedRoutes.register(friendsPrivateRoutes, { prefix: "/api/friends" })
	protectedRoutes.register(chatPrivateRoutes, { prefix: "/api/chat" })

	//WebSocket routes
	fastify.register(wsPrivateRoutes, { prefix: "/ws"})
});

try {
  await fastify.listen({ port: 3000, host: '0.0.0.0' })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}