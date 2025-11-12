import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateUserData, CreateUserInput, EditInput, LoginInput, UploadInput } from './user.schema.js';
import { userService } from './user.service.js'
import type { User } from '@prisma/client';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

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

async function loginUserHandler ( request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) {
	const data = request.body;

	const user = await userService.authenticateUser(request.server.prisma, data);
	if (!user)
    	return reply.code(401).send({ message: "Invalid email or password" });
	
	const session = await userService.createSession(request.server.prisma, user.id);

	return { 
		accessToken: session.id, 
    	...user
  };
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

async function protectedRouteHandler(request: FastifyRequest, reply: FastifyReply) {
	try {
		const session = await userService.validateToken(request.server.prisma, request.headers.authorization)
		request.user = session.user;
	} catch (error: unknown) {
		if (error instanceof Error)
			return reply.code(401).send({ message: error.message });
		return reply.code(401).send({ message: 'Unauthorized' });
	}
}

// =====================
// User CRUD Handlers
// =====================

async function createUserHandler (request: FastifyRequest<{ Body: CreateUserInput }>, reply: FastifyReply) {
	const { avatarFile, ...userData } = request.body;

	const user = await userService.findUserByEmail(request.server.prisma, userData);
	if (user) {
		return reply.status(409).send({ message: 'User already exists' });
	}

	let avatarUrl = '/uploads/avatars/default.jpg';

	if (avatarFile && avatarFile.file) {
		const fileBuffer = await avatarFile.toBuffer();
		if (!fileBuffer || fileBuffer.length === 0) {
			return reply.code(400).send({
				message: "Uploaded file is empty",
			});
		}
		const fileExtension = path.extname(avatarFile.filename);
		const uniqueFilename = `${randomUUID()}${fileExtension}`;
		const __dirname = path.dirname(fileURLToPath(import.meta.url));
		const uploadDir = path.join(__dirname, '../../../uploads/avatars/');
		await fs.writeFile(path.join(uploadDir, uniqueFilename), fileBuffer);
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
		const { avatarFile } = request.body;
		let avatarUrl = '/uploads/avatars/default.jpg';

		const user = await userService.findUserById(request.server.prisma, request.user.id);
		if (user && user.avatarUrl && user.avatarUrl !== '/uploads/avatars/default.jpg') {
			const __dirname = path.dirname(fileURLToPath(import.meta.url));
            const filePath = path.join(__dirname, '../../..', user.avatarUrl);
            await fs.unlink(filePath);
		}
		if (avatarFile && avatarFile.file) {
			const fileBuffer = await avatarFile.toBuffer();
			if (!fileBuffer || fileBuffer.length === 0) {
				return reply.code(400).send({
					message: "Uploaded file is empty",
				});
			}
			const fileExtension = path.extname(avatarFile.filename);
			const uniqueFilename = `${randomUUID()}${fileExtension}`;
			const __dirname = path.dirname(fileURLToPath(import.meta.url));
			const uploadDir = path.join(__dirname, '../../../uploads/avatars/');
			await fs.writeFile(path.join(uploadDir, uniqueFilename), fileBuffer);
			avatarUrl = `/uploads/avatars/${uniqueFilename}`;
		}
		return await userService.editUser(request.server.prisma, request.user.id, { avatarUrl })
	} catch (error: unknown) {
		if (error instanceof Error)
			return reply.code(500).send({ message: error.message });
		return reply.code(500).send({ message: 'Unauthorized' });
	}
}

async function deleteHandler(request: FastifyRequest<{Body: EditInput, Params: { id: string}}>, reply: FastifyReply) {
	try {
		const user = await userService.findUserById(request.server.prisma, request.user.id);
		await userService.deleteUser(request.server.prisma, request.user?.id);
		if (user && user.avatarUrl && user.avatarUrl !== '/uploads/avatars/default.jpg') {
			const __dirname = path.dirname(fileURLToPath(import.meta.url));
            const filePath = path.join(__dirname, '../../..', user.avatarUrl);
            await fs.unlink(filePath);
		}
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
	
	// User CRUD
	createUserHandler,
	getUserHandler,
	editUserHandler,
	deleteHandler,
	uploadAvatarHandler
};