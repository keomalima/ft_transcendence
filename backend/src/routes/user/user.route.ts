import type { FastifyInstance } from 'fastify'
import { createUserHandler, loginUserHandler } from './user.controller.js'
import { createUserSchema, userResponseSchema, loginResponseSchema, loginSchema } from "./user.schema.js";

export async function userRoutes(fastify: FastifyInstance) {
	fastify.post('/login', { 
		schema: { 
			body: loginSchema,
			response: { 
				200: loginResponseSchema
			}
		}
	}, 
	loginUserHandler
	);

	fastify.post('/', { 
		schema: { 
			body: createUserSchema, 
			response: { 
				201: userResponseSchema 
			}
		}
	}, 
	createUserHandler
	);
}