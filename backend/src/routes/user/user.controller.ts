import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateUserInput } from './user.schema.js';
import { createUser, listUsers } from './user.service.js'

export async function listUsersHandler (
	request: FastifyRequest, 
	reply: FastifyReply
) {
	const users = await listUsers(request.server.prisma);
	reply.send(users);
}

export async function createUserHandler (
	request: FastifyRequest<{ Body: CreateUserInput }>, 
	reply: FastifyReply
) {
	const body = request.body;
	try {
		const user = await createUser(request.server.prisma, body);
		return reply.code(201).send(user);
	} catch (error) {
		request.log.error(error);
		return reply.code(400).send({ 
			error: 'Failed to create user',
			message: error instanceof Error ? error.message : 'Unknown error'
		});
	}
}