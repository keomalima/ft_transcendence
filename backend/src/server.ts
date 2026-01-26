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
import googleAuthPlugin from './plugins/googleAuth.plugin.js';

const fastify = Fastify({
  	logger: true,
  	trustProxy: true
}).withTypeProvider<ZodTypeProvider>();

await fastify.register(cookie, {
	secret: process.env.COOKIE_SECRET,
} as FastifyCookieOptions)

await fastify.register(cors, {
	origin: true,
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true
});

await fastify.register(googleAuthPlugin);

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