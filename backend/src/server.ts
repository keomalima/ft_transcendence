import Fastify from 'fastify'
import cors from '@fastify/cors';
import { 
  serializerCompiler, 
  validatorCompiler, 
  type ZodTypeProvider 
} from "fastify-type-provider-zod";
import { userRoutes } from './routes/user/user.route.js'
import prismaPlugin from './plugins/prisma.plugin.js';

const fastify = Fastify({
  logger: true
}).withTypeProvider<ZodTypeProvider>();

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

await fastify.register(cors, { origin: true });
fastify.register(prismaPlugin);
fastify.register(userRoutes, { prefix: "/api/users" });

// Run the server!
try {
  await fastify.listen({ port: 3000, host: '0.0.0.0' })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}