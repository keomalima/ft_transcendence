import type { FastifyInstance } from 'fastify'
import { userController } from './user.controller.js'
import { userSchemas } from "./user.schema.js";

// =====================
// Public Routes (No Authentication)
// =====================

export async function userPublicRoutes(fastify: FastifyInstance){
	fastify.post('/login', { 
		schema: { 
			body: userSchemas.request.login, 
			response: { 200: userSchemas.response.login },
			tags: ['Authentication'],
			description: 'Login user and get access token',
			summary: 'User login'
		}
	}, 
	userController.loginUserHandler);

	fastify.post('/', { 
		schema: { 
			consumes: ['multipart/form-data'],
			body: userSchemas.request.createUser, 
			response: { 201: userSchemas.response.createUser },
			tags: ['Users'],
			description: 'Create a new user account',
			summary: 'Create user'
		}
	}, 
	userController.createUserHandler);
}

// =====================
// Private Routes (Authentication Required)
// =====================

export async function userPrivateRoutes(fastify: FastifyInstance) {
	fastify.get('/:id', { 
		schema: { 
			response : { 200: userSchemas.response.getUser },
			tags: ['Users'],
			description: 'Get user details by ID',
			summary: 'Get user by ID',
			security: [{ bearerAuth: [] }]
		}
	}, 
	userController.getUserHandler);

	fastify.put('/me', { 
		schema: { 
			body: userSchemas.request.editUser, 
			response: { 200: userSchemas.response.editUser },
			tags: ['Users'],
			description: 'Update current user profile',
			summary: 'Update user profile',
			security: [{ bearerAuth: [] }]
		}
	},
	userController.editUserHandler);

	fastify.post('/logout', {
		schema: {
			tags: ['Authentication'],
			description: 'Logout current user',
			summary: 'User logout',
			security: [{ bearerAuth: [] }]
		}
	},
	userController.logoutHandler);

	fastify.delete('/', {
		schema: {
			tags: ['Users'],
			description: 'Delete current user account',
			summary: 'Delete user',
			security: [{ bearerAuth: [] }]
		}
	},
	userController.deleteHandler);

	fastify.post('/upload', {
    	schema: {
			consumes: ['multipart/form-data'],
			body: userSchemas.request.uploadAvatar,
			response: { 201: userSchemas.response.uploadtAvatar },
			tags: ['Users'],
			description: 'Upload avatar profile',
			summary: 'Upload Avatar',
			security: [{ bearerAuth: [] }]
   		},
  	},
	userController.uploadAvatarHandler);
}