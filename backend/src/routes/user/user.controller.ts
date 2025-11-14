import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateUserData, CreateUserInput, EditInput, LoginInput, UploadInput } from './user.schema.js';
import { userService } from './user.service.js'
import type { User } from '@prisma/client';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { writeFile } from 'fs/promises';
import { hashPassword, verifyPassword } from '../../plugins/hash.plugin.js';
import path from 'path';

// =====================
// Type Declarations
// =====================

declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
  }
}

// =====================
// Authentication Handlers
// =====================

async function protectedRouteHandler(request: FastifyRequest, reply: FastifyReply) {
	try {
		const token = request.headers.authorization;
		if (!token) {
			return reply.code(400).send({
                message: "Unauthorized: No token provided"
            });
		}
		const [scheme, credentials] = (token ?? '').split(' ');
		if (scheme !== 'Bearer' || !credentials) {
			return reply.code(400).send({
                message: "Unauthorized: Invalid token format"
            });
		}
		const session = await userService.validateToken(request.server.prisma, credentials)
		if (!session) {
			return reply.code(400).send({
                message: "Unauthorized: Invalid token"
            });
		}
		if (session.expiresAt < new Date()) {
			return reply.code(400).send({
                message: "Unauthorized: Token expired"
            });
		}
		request.user = session.user;
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to authenticate user"});
	}
}

async function loginUserHandler ( request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) {
	try {
		const data = request.body;
		const prisma = request.server.prisma

		const user = await userService.findUserByEmail(prisma, data);
		if (!user){
			return reply.code(401).send({
                message: "Invalid email or password"
            });
		}
		
		const isValid = verifyPassword(data.password, user.password, user.salt);
		if (!isValid){
			return reply.code(401).send({
                message: "Invalid email or password"
            });
		}
		
		const { password, salt, ...safeUser } = user;
		const session = await userService.createSession(request.server.prisma, user.id);
		return { 
			accessToken: session.id, 
	    	...safeUser
	  };	
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to login user"});
	}
}

async function logoutHandler(request: FastifyRequest, reply: FastifyReply) {
	try {
		await userService.logoutUser(request.server.prisma, request.user!.id);
		reply.code(204).send()
	} catch (error: unknown) {
		if (error instanceof Error)
			return reply.code(401).send({ message: error.message });
		return reply.code(401).send({ message: 'Unauthorized' });
	}
}

// DELETE AFTER, ONLY FOR DEV
async function getUserHandlerDev(request: FastifyRequest, reply: FastifyReply) {
	try {
		const users = await userService.getUsersDev(request.server.prisma);
		if (users.length === 0) {
    		return reply.code(404).send({ message: 'No users found' });
		}
		return users;
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to fetch users"});
	}
}

// =====================
// User CRUD Handlers
// =====================

async function createUserHandler (request: FastifyRequest<{ Body: CreateUserInput }>, reply: FastifyReply) {
	const { avatarFile, ...userData } = request.body;

	let avatarUrl = '/uploads/avatars/default.png';

	if (avatarFile && avatarFile.file) {
		const fileExtension = path.extname(avatarFile.filename);
		const uniqueFilename = `${randomUUID()}${fileExtension}`;
		const __dirname = path.dirname(fileURLToPath(import.meta.url));
		const uploadDir = path.join(__dirname, '../../../uploads/avatars/');
		const fileBuffer = await avatarFile.toBuffer();
		await writeFile(path.join(uploadDir, uniqueFilename), fileBuffer);
    	avatarUrl = `/uploads/avatars/${uniqueFilename}`;
  	}

	try {
		const newUser = await userService.createUser(request.server.prisma, {
			...userData,
			avatarUrl
		} as CreateUserData)
		reply.code(201);
		return (newUser);
	} catch (error: any) {
		if (error.code == 'P2002')
    		return reply.status(409).send({ message: 'User already exists' });
		reply.code(500).send({ message: "Failed to create user"});
	}
}

async function getUserHandler( request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
	if (request.params.id === request.user!.id)
		return request.user;
	
	const user = await userService.findUserById(request.server.prisma, request.params.id);

	if (!user) {
		return reply.code(404).send({
			message: "User not found"
		});
	}
	return user;
}

async function editUserHandler(request: FastifyRequest<{Body: EditInput}>, reply: FastifyReply){
	try {
		return await userService.editUser(request.server.prisma, request.user!.id, request.body);
	} catch (error: unknown) {
		if (error instanceof Error)
			return reply.code(401).send({ message: error.message });
		return reply.code(401).send({ message: 'Unauthorized' });
	}
}

async function uploadAvatarHandler(request: FastifyRequest<{Body: UploadInput}>, reply: FastifyReply){
	try {
		const { avatarUrl } = request.body;

		if (!avatarUrl || !avatarUrl.file)
			return reply.code(400).send({ message: 'No file uploaded' });

		const fileExtension = path.extname(avatarUrl.filename);
		const uniqueFilename = `${randomUUID()}${fileExtension}`;
		const __dirname = path.dirname(fileURLToPath(import.meta.url));
		const uploadDir = path.join(__dirname, '../../../uploads/avatars/');

		const fileBuffer = await avatarUrl.toBuffer();
		await writeFile(path.join(uploadDir, uniqueFilename), fileBuffer);

		return reply.code(201).send({ 
			message: 'File received successfully',
			filename: uniqueFilename,
			avatarUrl: `/uploads/avatars/${uniqueFilename}`,
			mimetype: avatarUrl.mimetype 
		});
	} catch (error: unknown) {
		console.error('Upload error:', error);
		if (error instanceof Error)
			return reply.code(500).send({ message: error.message });
		return reply.code(500).send({ message: 'Failed to upload file' });
	}
}

async function deleteHandler(request: FastifyRequest<{Body: EditInput, Params: { id: string}}>, reply: FastifyReply) {
	try {
		await userService.deleteUser(request.server.prisma, request.user!.id);
		reply.code(204).send()
	} catch (error: unknown) {
		if (error instanceof Error)
			return reply.code(401).send({ message: error.message });
		return reply.code(401).send({ message: 'Unauthorized' });
	}
}

// =====================
// Export Controller Object
// =====================

export const userController = {
	// Authentication
	loginUserHandler,
	logoutHandler,
	protectedRouteHandler,
	getUserHandlerDev,
	
	// User CRUD
	createUserHandler,
	getUserHandler,
	editUserHandler,
	deleteHandler,
	uploadAvatarHandler
};