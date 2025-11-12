import Fastify from 'fastify'
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { 
  serializerCompiler, 
  validatorCompiler, 
  type ZodTypeProvider,
  jsonSchemaTransform
} from "fastify-type-provider-zod";
import { userRoutes } from './routes/user/user.route.js'
import prismaPlugin from './plugins/prisma.plugin.js';

const fastify = Fastify({
  logger: true
}).withTypeProvider<ZodTypeProvider>();

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

await fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

// Register Swagger
await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'ft_transcendence API',
      description: 'API documentation for ft_transcendence project',
      version: '1.0.0'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  transform: jsonSchemaTransform,
});

await registerSwagger(fastify);
await registerSwaggerUi(fastify);

fastify.register(fastifyMultipart, { attachFieldsToBody: true, limits: { fileSize: 10 * 1024 * 1024 }})
fastify.register(prismaPlugin);

fastify.register(userPublicRoutes, { prefix: "/api/users" });

fastify.register(async (protectedRoutes) => {
	protectedRoutes.addHook('onRequest', async (request, reply) => await userController.protectedRouteHandler(request, reply));
	protectedRoutes.register(userPrivateRoutes, { prefix: "/api/users" })
	protectedRoutes.register(gamePrivateRoutes, { prefix: "/api/games" })
});

try {
  await fastify.listen({ port: 3000, host: '0.0.0.0' })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
