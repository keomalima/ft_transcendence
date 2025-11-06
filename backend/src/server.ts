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

await fastify.register(cors, { origin: true });

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

// Register Swagger UI
await fastify.register(swaggerUI, {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true
  },
  staticCSP: true,
});

fastify.register(prismaPlugin);
fastify.register(userRoutes, { prefix: "/api/users" });

// Run the server!
try {
  await fastify.listen({ port: 3000, host: '0.0.0.0' })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
