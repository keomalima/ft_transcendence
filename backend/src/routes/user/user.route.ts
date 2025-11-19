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

	// DELETE AFTER, ONLY FOR DEV
	fastify.get('/', {
		schema: { 
			response : { 200: userSchemas.response.getUserDev },
			tags: ['Dev'],
			description: 'Get all users details ONLY FOR DEV',
			summary: 'Get all users ONLY FOR DEV',
			security: [{ bearerAuth: [] }]
		}
	}, 
	userController.getUserHandlerDev)

	// DEV ONLY: Clean all tables
    fastify.delete('/clean', {
        schema: {
            tags: ['Dev'],
            description: 'Delete all data in the database (DEV ONLY)',
            summary: 'Clean database (DEV ONLY)'
        }
    }, async (req, reply) => {
        const prisma = req.server.prisma
        
        try {
            // Delete in correct order to respect foreign key constraints
            // 1. Delete GamePlayers first (has FK to both Game and User)
            await prisma.gamePlayer.deleteMany();
            
            // 2. Delete Games (has FK to User)
            await prisma.game.deleteMany();
            
            // 3. Delete Friendships (has FK to User)
            await prisma.friendship.deleteMany();
            
            // 4. Delete Sessions (has FK to User)
            await prisma.session.deleteMany();
            
            // 5. Finally delete Users
            await prisma.user.deleteMany();
            
            return reply.send({ message: "Database cleaned successfully" });
        } catch (error: any) {
            req.log.error('Error cleaning database:', error);
            return reply.code(500).send({ 
                message: "Failed to clean database",
                error: error.message 
            });
        }
    });
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
			security: [{ bearerAuth: [] }]
		}, 
		preHandler: userController.updateLastSeen,
		handler: userController.editUserHandler
	});

	fastify.post('/logout', {
		schema: {
			tags: ['Authentication'],
			description: 'Logout current user',
			summary: 'User logout',
			security: [{ bearerAuth: [] }]
		},
		handler: userController.logoutHandler
	});

	fastify.delete('/', {
		schema: {
			tags: ['Users'],
			description: 'Delete current user account',
			summary: 'Delete user',
			security: [{ bearerAuth: [] }]
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
			security: [{ bearerAuth: [] }]
   		},
		handler: userController.uploadAvatarHandler
  	});
}