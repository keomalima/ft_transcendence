import fp from 'fastify-plugin'
import { PrismaClient } from '@prisma/client'

declare module 'fastify' {
	interface FastifyInstance {
		prisma: PrismaClient;
	}
}

export default fp(async (fastify, opts) => {
	const prisma = new PrismaClient();

	fastify.decorate('prisma', prisma);

	fastify.addHook('onClose', async (fastifyInstance) => {
		await fastifyInstance.prisma.$disconnect();
	});
})