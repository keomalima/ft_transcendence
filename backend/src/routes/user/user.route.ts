import type { FastifyInstance } from 'fastify'
import { createUserHandler, deleteHandler, editUserHandler, getUserHandler, loginUserHandler, logoutHandler } from './user.controller.js'
import { createUserSchema, createUserResponseSchema, loginResponseSchema, loginSchema, getUserResponseSchema, editUserResponseSchema, editUserSchema } from "./user.schema.js";
import type { User } from '@prisma/client';
import { validateToken } from './user.service.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
  }
}

export async function userRoutes(fastify: FastifyInstance) {
	// Public routes (no authentication)
	fastify.post('/login', { 
		schema: { 
			body: loginSchema, 
			response: { 200: loginResponseSchema },
			tags: ['Authentication'],
			description: 'Login user and get access token',
			summary: 'User login'
		}
	}, 
	loginUserHandler);

	fastify.post('/', { 
		schema: { 
			body: createUserSchema, 
			response: { 201: createUserResponseSchema },
			tags: ['Users'],
			description: 'Create a new user account',
			summary: 'Create user'
		}
	}, 
	createUserHandler);

	// Protected routes
	fastify.register(async (protectedRoutes) => {
		protectedRoutes.addHook('onRequest', async (request, reply) => {
			try {
				const session = await validateToken(request.server.prisma, request.headers.authorization)
				request.user = session.user;
				
			} catch (error: unknown) {
				if (error instanceof Error)
			    	return reply.code(401).send({ message: error.message });
			  return reply.code(401).send({ message: 'Unauthorized' });
			}
		})

		protectedRoutes.get('/:id', { 
			schema: { 
				response : { 200: getUserResponseSchema },
				tags: ['Users'],
				description: 'Get user details by ID',
				summary: 'Get user by ID',
				security: [{ bearerAuth: [] }]
			}
		}, 
		getUserHandler);

		protectedRoutes.put('/me', { 
			schema: { 
				body: editUserSchema, 
				response: { 200: editUserResponseSchema },
				tags: ['Users'],
				description: 'Update current user profile',
				summary: 'Update user profile',
				security: [{ bearerAuth: [] }]
			}
		},
		editUserHandler);

		protectedRoutes.post('/logout', {
			schema: {
				tags: ['Authentication'],
				description: 'Logout current user',
				summary: 'User logout',
				security: [{ bearerAuth: [] }]
			}
		},
		logoutHandler)

		protectedRoutes.delete('/', {
			schema: {
				tags: ['Users'],
				description: 'Delete current user account',
				summary: 'Delete user',
				security: [{ bearerAuth: [] }]
			}
		},
		deleteHandler)
	})
}