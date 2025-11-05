import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateUserInput, EditInput, LoginInput } from './user.schema.js';
import { authenticateUser, createSession, createUser, deleteUser, editUser, findUserById, findUserBySession, logoutUser } from './user.service.js'

export async function loginUserHandler ( request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) {
	const data = request.body;

	const user = await authenticateUser(request.server.prisma, data);
	if (!user)
    	return reply.code(401).send({ message: "Invalid email or password" });
	
	const session = await createSession(request.server.prisma, user.id);

	return { 
		accessToken: session.id, 
    	...user
  };
}

export async function createUserHandler (request: FastifyRequest<{ Body: CreateUserInput }>, reply: FastifyReply) {
	const data = request.body;
	
	try {
		const newUser = await createUser(request.server.prisma, data);
		reply.code(201);
		return (newUser);
	} catch (error: any) {
		if (error.code == 'P2002')
    		reply.status(409).send({ message: 'User already exists' });
		reply.code(500).send({ message: "Failed to create user"});
	}
}

export async function getUserHandler( request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
	if (request.params.id === request.user?.id)
		return request.user;
	
	const user = await findUserById(request.server.prisma, request.params.id);

	if (!user) {
		return reply.code(404).send({
			message: "User not found"
		});
	}
	return user;
}

export async function editUserHandler(request: FastifyRequest<{Body: EditInput, Params: { id: string}}>, reply: FastifyReply){
	const data = request.body;

	const user = await findUserBySession(request.server.prisma, request.headers.authorization);
	
	if (user?.id != request.params.id)
		return reply.code(403).send({ message: "Unauthorized" });

	const updateData = Object.fromEntries
    	Object.entries(request.body).filter(([_, v]) => v !== undefined)
		
	try {
		return await editUser(request.server.prisma, request.params.id, request.body);
	} catch (error: unknown) {
		if (error instanceof Error)
			return reply.code(401).send({ message: error.message });
		return reply.code(401).send({ message: 'Unauthorized' });
	}
}

export async function deleteHandler(request: FastifyRequest<{Body: EditInput, Params: { id: string}}>, reply: FastifyReply) {
	try {
		await deleteUser(request.server.prisma, request.user?.id);
		reply.code(204)
	} catch (error: unknown) {
		if (error instanceof Error)
			return reply.code(401).send({ message: error.message });
		return reply.code(401).send({ message: 'Unauthorized' });
	}
}

export async function logoutHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
	const user = await findUserBySession(request.server.prisma, request.headers.authorization);

	if (!user?.id)
		return reply.code(401).send({ message: "Unauthorized" });

	try {
		await logoutUser(request.server.prisma, user.id);
		reply.code(204)
	} catch (error: unknown) {
		if (error instanceof Error)
			return reply.code(401).send({ message: error.message });
		return reply.code(401).send({ message: 'Unauthorized' });
	}
}