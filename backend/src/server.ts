// Node.js/core
import { fileURLToPath } from 'url';
import path from 'path';

// Third-party
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import fastifyWebsocket from '@fastify/websocket';
import type { FastifyCookieOptions } from '@fastify/cookie';
import cookie from '@fastify/cookie';

// Fastify plugins
import prismaPlugin from './plugins/prisma.plugin.js';
import googleAuthPlugin from './plugins/googleAuth.plugin.js';

// Project-specific
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { registerSwagger, registerSwaggerUi } from './registers/swagger.register.js';
import { userController } from './routes/user/user.controller.js';
import { userPublicRoutes, userPrivateRoutes } from './routes/user/user.route.js';
import { gamePrivateRoutes } from './routes/game/game.route.js';
import { friendsPrivateRoutes } from './routes/friends/friends.route.js';
import { tournamentPrivateRoutes } from './routes/tournaments/tournament.route.js';
import { chatPrivateRoutes } from './routes/chat/chat.route.js';
import { wsPrivateRoutes } from './routes/websockets/ws.routes.js';

// Fastify instance
const fastify = Fastify({ logger: true, trustProxy: true }).withTypeProvider<ZodTypeProvider>();

// Plugin registration
await fastify.register(cookie, { secret: process.env.COOKIE_SECRET } as FastifyCookieOptions);
await fastify.register(googleAuthPlugin);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
fastify.register(fastifyStatic, { root: path.join(__dirname, '../uploads'), prefix: '/uploads/' });
fastify.register(fastifyWebsocket);
fastify.register(fastifyMultipart, { attachFieldsToBody: true, limits: { fileSize: 10 * 1024 * 1024 } });
fastify.register(prismaPlugin);

// Utility setup
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);
await registerSwagger(fastify);
await registerSwaggerUi(fastify);

// NotFound handler
fastify.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/uploads/')) {
        return reply.sendFile('default.jpg', path.join(__dirname, '../uploads/avatars'));
    }
    return reply.code(404).send({ error: 'Route not found' });
});

// Route registration
fastify.register(userPublicRoutes, { prefix: "/api/users" });
fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', async (request, reply) => await userController.protectedRouteHandler(request, reply));
    protectedRoutes.register(userPrivateRoutes, { prefix: "/api/users" });
    protectedRoutes.register(gamePrivateRoutes, { prefix: "/api/games" });
    protectedRoutes.register(tournamentPrivateRoutes, { prefix: "/api/tournaments" });
    protectedRoutes.register(friendsPrivateRoutes, { prefix: "/api/friends" });
    protectedRoutes.register(chatPrivateRoutes, { prefix: "/api/chat" });
    fastify.register(wsPrivateRoutes, { prefix: "/ws" });
});

// Server start
try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
} catch (err) {
    fastify.log.error(err);
    process.exit(1);
}