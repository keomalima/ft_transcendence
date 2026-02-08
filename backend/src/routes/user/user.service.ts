import { PrismaClient } from "@prisma/client";
import type { CreateUserData, CreateUserInput, EditInput, LoginInput, ChangeUserPassword } from './user.schema.js';
import { hashPassword, verifyPassword } from '../../plugins/hash.plugin.js';

// =====================
// User CRUD Operations
// =====================

async function findUserByEmail(prisma: PrismaClient, data: LoginInput) {
  return prisma.user.findUnique({
    where: {
      email: data.email,
    }
  });
}

async function cleanLastSeen(prisma: PrismaClient, userId: string){
	return prisma.user.update({
		where: {id: userId},
		data: {
			lastSeenAt: null
		}
	})
}

async function findUserById(prisma: PrismaClient, id: string) {
  return prisma.user.findUnique({
    where: { id }
  });
}

async function findUserByDisplayName(prisma: PrismaClient, displayName: string){
	return prisma.user.findUnique({
		where: { displayName },
		select: {
			id: true,
			displayName: true,
			email: true,
		}
	})
}

async function createUser(prisma: PrismaClient, data: CreateUserData) {
  const { hash, salt } = hashPassword(data.password);

  return prisma.user.create({
    data: {
      ...data,
      salt,
      password: hash,
    },
    select: {
      id: true,
      email: true,
      name: true,
      displayName: true,
      createdAt: true,
    }
  });
}

async function editUser(prisma: PrismaClient, id: string, data: EditInput) {
  if (data.displayName !== undefined) {
    const existingUser = await prisma.user.findUnique({ where: { displayName: data.displayName } });
    if (existingUser) {
      throw new Error("Display name's not available");
    }
  }

  const updateData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );

  return prisma.user.update({
    where: { id: id },
    data: { ...updateData },
    select: {
      id: true,
      email: true,
      name: true,
      displayName: true,
      surname: true,
      avatarUrl: true,
      isOnline: true,
      createdAt: true,
      updatedAt: true,
    }
  });
}

async function changeUserPassword(prisma: PrismaClient, id:string, newPassword: string) {
	const { hash, salt } = hashPassword(newPassword);

  return prisma.user.update({
    where: { id: id },
    data: {
		salt,
		password: hash
	 },
  });
}

async function editUserAvatar(prisma: PrismaClient, id: string, avatarUrl: string) {
	return prisma.user.update({
    where: { id: id },
    data: { avatarUrl },
    select: {
      id: true,
      avatarUrl: true,
      updatedAt: true,
    }
  });
}

async function deleteUser(prisma: PrismaClient, id: string) {
  return prisma.user.delete({
    where: { id },
  });
}

// =====================
// Session Operations
// =====================

async function createSession(prisma: PrismaClient, userId: string) {
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + 7);
	
	await prisma.user.update({
		where: { id: userId },
		data: { lastSeenAt: new Date() }
	});

	await prisma.session.deleteMany({
		where: { userId }
	})

	return prisma.session.create({
		data: {
			userId,
			expiresAt
		}
	});
}

// =====================
// Authentication & Authorization
// =====================

async function logoutUser(prisma: PrismaClient, id: string) {
	await prisma.session.deleteMany({
		where: { userId: id }
	});
}

async function validateToken(prisma: PrismaClient, credentials: string) {
	return await prisma.session.findUnique({
	    where: { id: credentials },
	    include: { user: true }
	});
}

async function updateLastSeen(prisma: PrismaClient, id: string) {
	return prisma.user.update({
		where : {id},
		data : { lastSeenAt: new Date() }
	})
}

// =====================
// Export Service Object
// =====================

export const userService = {
  // User operations
  findUserByEmail,
  findUserById,
  createUser,
  editUser,
  changeUserPassword,
  deleteUser,
  editUserAvatar,
  updateLastSeen,
  findUserByDisplayName,
  cleanLastSeen,
  
  // Session operations
  createSession,
  
  // Authentication
  logoutUser,
  validateToken
};
