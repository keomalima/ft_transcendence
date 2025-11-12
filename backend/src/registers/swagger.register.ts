import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { jsonSchemaTransform } from "fastify-type-provider-zod";

export async function registerSwagger(fastify: any) {
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
}

export async function registerSwaggerUi(fastify: any) {
	await fastify.register(swaggerUI, {
	routePrefix: '/documentation',
	uiConfig: {
		docExpansion: 'list',
		deepLinking: true
	},
		staticCSP: true,
	});
}