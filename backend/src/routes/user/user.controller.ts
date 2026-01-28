import type { FastifyReply, FastifyRequest } from 'fastify'
import type { ChangeUserPassword, CreateUserData, CreateUserInput, EditInput, LoginInput, UploadInput } from './user.schema.js';
import { userService } from './user.service.js'
import type { User } from '@prisma/client';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { verifyPassword } from '../../plugins/hash.plugin.js';
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

type GoogleUserData = {
    email: string;
    name: string;
    id: string;
    family_name: string;
    given_name: string;
    picture: string;
};

declare module 'fastify' {
  interface FastifyInstance {
    googleOAuth2: import('@fastify/oauth2').OAuth2Namespace;
  }
}

// =====================
// Authentication Handlers
// =====================

async function protectedRouteHandler(request: FastifyRequest, reply: FastifyReply) {
	try {
		const sessionId = request.cookies?.sessionId;
		if (!sessionId) {
			return reply.code(401).send({
                message: "Unauthorized: No session cookie provided"
            });
		}
		const session = await userService.validateToken(request.server.prisma, sessionId)
		if (!session) {
			return reply.code(401).send({
                message: "Unauthorized: Invalid token"
            });
		}
		if (session.expiresAt < new Date()) {
			return reply.code(401).send({
                message: "Unauthorized: Token expired"
            });
		}
		request.user = session.user;
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to authenticate user"});
	}
}

async function validateSessionAuth ( request: FastifyRequest, reply: FastifyReply) {
	if (request.user)
		return reply.code(200).send(request.user);
	else
		return reply.code(401).send({ message: "Unauthorized" });
}

async function loginUserHandler ( request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) {
	try {
		const data = request.body;
		const prisma = request.server.prisma

		const user = await userService.findUserByEmail(prisma, data);
		if (!user){
			return reply.code(400).send({
                message: "Invalid email or password"
            });
		}
		
		const isValid = verifyPassword(data.password, user.password, user.salt);
		if (!isValid){
			return reply.code(400).send({
                message: "Invalid email or password"
            });
		}
		
		const { password, salt, ...safeUser } = user;
		const session = await userService.createSession(request.server.prisma, user.id);
		const isProduction = process.env.NODE_ENV === 'production';
		reply.setCookie('sessionId', session.id, {
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			path: '/',
			maxAge: 60 * 60 * 24,
		})
		return safeUser;	
	} catch (error: any) {
		request.log.error(error);
		reply.code(500).send({ message: "Failed to login user"});
	}
}

async function loginGoogleHandler (request: FastifyRequest, reply: FastifyReply) {
	try {
		const { token } = await request.server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
		
		const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
			headers: {
				Authorization: `Bearer ${token.access_token}`
			}
		});

		const userData = await userResponse.json() as GoogleUserData;

		let newUser;
		const user = await userService.findUserByEmail(request.server.prisma, {
			email: userData.email,
			password: ''
		} );
		if (!user) {
			newUser = await userService.createUser(request.server.prisma, {
				email: userData.email,
				name: userData.name,
				password: userData.id,
				surname: userData.family_name,
				displayName: userData.given_name,
				avatarUrl: userData.picture,
			} as CreateUserData);
		} else {
			newUser = user;
		}
		
		const session = await userService.createSession(request.server.prisma, newUser.id);
		const isProduction = process.env.NODE_ENV === 'production';
		reply.setCookie('sessionId', session.id, {
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			path: '/',
			maxAge: 60 * 60 * 24,
		})
		return reply.redirect('https://localhost:8443/home');
	} catch (err) {
		reply.code(500).send({ message: "Failed to login user with google"});
	}
}

async function logoutHandler(request: FastifyRequest, reply: FastifyReply) {
	try {
		await userService.logoutUser(request.server.prisma, request.user!.id);
		reply.clearCookie('sessionId', { path: '/' });
		reply.code(204).send();
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

	try {
		let avatarUrl = '/uploads/avatars/default.jpg';

        if (avatarFile?.file) {
            const fileBuffer = await avatarFile.toBuffer();
            if (fileBuffer && fileBuffer.length > 0) {
                avatarUrl = await saveAvatarFile(avatarFile, fileBuffer);
            }
        }

		const newUser = await userService.createUser(request.server.prisma, {
			...userData,
			avatarUrl
		} as CreateUserData)
		reply.code(201);
		return (newUser);
	} catch (error: any) {
		if (error.code == 'P2002')
    		return reply.status(409).send({ message: 'User already exists' });
		request.log.error(error);
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
		if (error instanceof Error) {
			// Display name conflict should return 409, not 401
			if (error.message.includes("Display name's not available")) {
				return reply.code(409).send({ message: error.message });
			}
			return reply.code(500).send({ message: error.message });
		}
		return reply.code(500).send({ message: 'Internal server error' });
	}
}

async function changeUserPasswordHandler(request: FastifyRequest<{Body: ChangeUserPassword}>, reply: FastifyReply) {
	const { currentPassword, newPassword } = request.body;

	const user = await userService.findUserById(request.server.prisma, request.user!.id);
	if (!user) {
		return reply.code(404).send({ message: "User not found" });
	}
	const isValid = verifyPassword(currentPassword, user.password, user.salt);
	if (!isValid) {
		return reply.code(400).send({
			message: "Invalid password"
		});
	}
	if (currentPassword === newPassword) {
		return reply.code(400).send({
			message: "New password must be different"
		});
	}
	try {
		return await userService.changeUserPassword(request.server.prisma, request.user!.id, newPassword);
	} catch (error : unknown) {
		reply.code(500).send({ message: "Failed to change password"});
	}
}

async function uploadAvatarHandler(request: FastifyRequest<{Body: UploadInput}>, reply: FastifyReply){
    try {
        const { avatarFile } = request.body;
        const userId = request.user!.id;

        if (!avatarFile?.file) {
            return reply.code(400).send({
                message: "No file provided",
            });
        }

        const fileBuffer = await avatarFile.toBuffer();
        if (!fileBuffer || fileBuffer.length === 0) {
            return reply.code(400).send({
                message: "Uploaded file is empty",
            });
        }

        await deleteOldAvatar(userId, request.server.prisma);

        const avatarUrl = await saveAvatarFile(avatarFile, fileBuffer);

        return await userService.editUserAvatar(request.server.prisma, userId, avatarUrl);
    } catch (error: unknown) {
        request.server.log.error(error);
        const message = error instanceof Error ? error.message : 'Failed to upload avatar';
        return reply.code(500).send({ message });
    }
}

async function deleteHandler(request: FastifyRequest<{Body: EditInput, Params: { id: string}}>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
        
        await deleteOldAvatar(userId, request.server.prisma);
        await userService.deleteUser(request.server.prisma, userId);
        
        reply.code(204).send();
	} catch (error: unknown) {
		if (error instanceof Error)
			return reply.code(401).send({ message: error.message });
		return reply.code(401).send({ message: 'Unauthorized' });
	}
}

// =====================
// Helper Functions
// =====================

async function updateLastSeen(request: FastifyRequest, reply: FastifyReply) {
	try {
		await userService.updateLastSeen(request.server.prisma, request.user!.id);
		return;
	} catch (error: any) {
		return reply.code(500).send("Error");
	}
}

async function deleteOldAvatar(userId: string, prisma: any): Promise<void> {
    const user = await userService.findUserById(prisma, userId);
    
    if (!user?.avatarUrl || user.avatarUrl === '/uploads/avatars/default.jpg') {
        return;
    }

    try {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const filePath = path.join(__dirname, '../../..', user.avatarUrl);
        await fs.unlink(filePath);
    } catch (error) {
        console.warn(`Failed to delete old avatar: ${user.avatarUrl}`, error);
    }
}

async function saveAvatarFile(avatarFile: any, fileBuffer: Buffer): Promise<string> {
    const fileExtension = path.extname(avatarFile.filename);
    const uniqueFilename = `${randomUUID()}${fileExtension}`;
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const uploadDir = path.join(__dirname, '../../../uploads/avatars/');
    
    await fs.writeFile(path.join(uploadDir, uniqueFilename), fileBuffer);
    
    return `/uploads/avatars/${uniqueFilename}`;
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
	updateLastSeen,
	loginGoogleHandler,
	
	// User CRUD
	createUserHandler,
	getUserHandler,
	editUserHandler,
	deleteHandler,
	uploadAvatarHandler,
	validateSessionAuth,
	changeUserPasswordHandler
};