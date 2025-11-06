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

const fastify = Fastify({
  logger: true
}).withTypeProvider<ZodTypeProvider>();

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

await fastify.register(cors, { origin: true });

await registerSwagger(fastify);
await registerSwaggerUi(fastify);

fastify.register(prismaPlugin);

fastify.register(userPublicRoutes, { prefix: "/api/users" });

fastify.register(async (protectedRoutes) => {
	protectedRoutes.addHook('onRequest', async (request, reply) => await userController.protectedRouteHandler(request, reply));
	protectedRoutes.register(userPrivateRoutes, { prefix: "/api/users" })
	protectedRoutes.register(gamePrivateRoutes, { prefix: "/api/games" })
})

try {
  await fastify.listen({ port: 3000, host: '0.0.0.0' })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
