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
		},
		handler: userController.loginUserHandler
	});

	fastify.post('/', { 
		schema: { 
			consumes: ['multipart/form-data'],
			body: userSchemas.request.createUser, 
			response: { 201: userSchemas.response.createUser },
			tags: ['Users'],
			description: 'Create a new user account',
			summary: 'Create user'
		},
		handler: userController.createUserHandler
	});

	fastify.get('/login/google/callback', {
		schema: {
			tags: ['Authentication'],
			description: 'Login user with google Auth',
			summary: 'User google login'
		},
		handler: userController.loginGoogleHandler
	})
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
			security: [{ cookieAuth: [] }]
		},
		preHandler: userController.updateLastSeen,
		handler: userController.getUserHandler
	});

	fastify.put('/me', { 
		schema: { 
			body: userSchemas.request.editUser, 
			response: { 200: userSchemas.response.editUser },
			tags: ['Users'],
			description: 'Update current user profile',
			summary: 'Update user profile',
			security: [{ cookieAuth: [] }]
		}, 
		preHandler: userController.updateLastSeen,
		handler: userController.editUserHandler
	});

	fastify.put('/password', { 
		schema: { 
			body: userSchemas.request.changeUserPassword, 
			response: { 200: userSchemas.response.changeUserPassword },
			tags: ['Users'],
			description: 'Change user password',
			summary: 'Change user password',
			security: [{ cookieAuth: [] }]
		}, 
		preHandler: userController.updateLastSeen,
		handler: userController.changeUserPasswordHandler
	});

	fastify.get('/me', {
		schema: {
			response: { 200: userSchemas.response.getUser },
			tags: ['Authentication'],
			description: 'Validate user session',
			summary: 'Validate user session',
			security: [{ cookieAuth: [] }]
		},
		preHandler: userController.updateLastSeen,
		handler: userController.validateSessionAuth
	});

	fastify.post('/logout', {
		schema: {
			tags: ['Authentication'],
			description: 'Logout current user',
			summary: 'User logout',
			security: [{ cookieAuth: [] }]
		},
		handler: userController.logoutHandler
	});

	fastify.delete('/', {
		schema: {
			tags: ['Users'],
			description: 'Delete current user account',
			summary: 'Delete user',
			security: [{ cookieAuth: [] }]
		},
		handler: userController.deleteHandler
	});

	fastify.post('/upload', {
    	schema: {
			consumes: ['multipart/form-data'],
			body: userSchemas.request.uploadAvatar,
			response: { 200: userSchemas.response.uploadtAvatar },
			tags: ['Users'],
			description: 'Upload avatar profile',
			summary: 'Upload Avatar',
			security: [{ cookieAuth: [] }]
   		},
		handler: userController.uploadAvatarHandler
  	});
}