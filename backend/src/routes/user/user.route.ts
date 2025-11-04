import type { FastifyInstance } from 'fastify'
import { listUsersHandler, createUserHandler } from './user.controller.js'
import { createUserSchema, userResponseSchema, usersResponseSchema } from "./user.schema.js";

export async function userRoutes(fastify: FastifyInstance) {
	fastify.get('/', { 
		schema: { 
			response: { 
				200: usersResponseSchema 
			}
		}
	}, 
	listUsersHandler
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