import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateUserInput, EditInput, LoginInput } from './user.schema.js';
import { userService } from './user.service.js'

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
	if (!request.user?.id)
		return reply.code(401).send({ message: "Unauthorized" });

	try {
		await userService.logoutUser(request.server.prisma, request.user.id);
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
	const data = request.body;
	
	try {
		const newUser = await userService.createUser(request.server.prisma, data);
		reply.code(201);
		return (newUser);
	} catch (error: any) {
		if (error.code == 'P2002')
    		return reply.status(409).send({ message: 'User already exists' });
		reply.code(500).send({ message: "Failed to create user"});
	}
}

async function getUserHandler( request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
	if (request.params.id === request.user?.id)
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
	if (!request.user?.id)
		return;
	try {
		return await userService.editUser(request.server.prisma, request.user.id, request.body);
	} catch (error: unknown) {
		if (error instanceof Error)
			return reply.code(401).send({ message: error.message });
		return reply.code(401).send({ message: 'Unauthorized' });
	}
}

async function deleteHandler(request: FastifyRequest<{Body: EditInput, Params: { id: string}}>, reply: FastifyReply) {
	try {
		await userService.deleteUser(request.server.prisma, request.user?.id);
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
};