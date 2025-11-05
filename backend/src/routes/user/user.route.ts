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
	fastify.post('/login', { schema: { body: loginSchema, response: { 200: loginResponseSchema}}}, 
	loginUserHandler);

	fastify.post('/', { schema: { body: createUserSchema, response: { 201: createUserResponseSchema }}}, 
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

		protectedRoutes.get('/:id', { schema: { response : { 200: getUserResponseSchema }}}, 
		getUserHandler);

		protectedRoutes.put('/:id', { schema: { body: editUserSchema, response: { 200: editUserResponseSchema }}},
		editUserHandler);

		protectedRoutes.post('/logout', logoutHandler)

		protectedRoutes.delete('/', deleteHandler)
	})
}