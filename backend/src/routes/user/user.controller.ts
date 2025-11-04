import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateUserInput, LoginInput } from './user.schema.js';
import { createUser, findUser } from './user.service.js'
import { hashPassowrd, verifyPassword } from '../../utils/hash.js';

export async function loginUserHandler (
	request: FastifyRequest<{ Body: LoginInput }>, 
	reply: FastifyReply
) {
	const data = request.body;
	
	const user = await findUser(request.server.prisma, data);
	if (!user) {
		return reply.code(401).send({
			message: "Invalid email or password",
		})
	}
	const correctPassword = verifyPassword(
		data.password,
		user.password,
		user.salt,
	)

	if (correctPassword) {
		const { password, salt, ...rest} = user;
		return { 
			message: "user logged in with success",
			accessToken: "token",
			...rest
		};
	}
	return reply.code(401).send({
		message: "Invalid email or password",
	})
}

export async function createUserHandler (
	request: FastifyRequest<{ Body: CreateUserInput }>, 
	reply: FastifyReply
) {
	const data = request.body;

	const user = await findUser(request.server.prisma, data);
	if (user) {
		return reply.code(401).send({
			message: "User with this email already exists"
		})
	}
	
	try {
		const { hash, salt } = hashPassowrd(data.password);

		const newUser = await createUser(request.server.prisma, data, salt, hash);
		return reply.code(201).send({message: "User created", ...newUser});
	} catch (error) {
		request.log.error(error);
		return reply.code(400).send({ 
			error: 'Failed to create user',
			message: error instanceof Error ? error.message : 'Unknown error'
		});
	}
}