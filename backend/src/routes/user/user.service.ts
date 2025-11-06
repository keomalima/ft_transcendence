import { PrismaClient } from "@prisma/client";
import type { CreateUserInput, EditInput, LoginInput } from './user.schema.js';
import { hashPassword, verifyPassword } from '../../plugins/hash.plugin.js';

export async function findUserByEmail(prisma: PrismaClient, data: LoginInput) {
  return prisma.user.findUnique({
    where: {
      email: data.email,
    }
  })
}

export async function editUser(prisma: PrismaClient, id: string, data: EditInput) {
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
    data: {...updateData}
  })
}

export async function createSession(prisma: PrismaClient, userId: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return prisma.session.create({
    data: {
      userId,
      expiresAt
    }
  });
}

export async function findUserById(prisma: PrismaClient, id: string) {
  return prisma.user.findUnique({
    where: { id }
  });
}

export async function createUser(prisma: PrismaClient, data: CreateUserInput) {
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

export async function logoutUser(prisma: PrismaClient, id: string) {

  const user = await prisma.user.update({
    where: { id },
    data: { isOnline: false }
  });

  await prisma.session.deleteMany({
    where: { userId: id }
  });
}

export async function authenticateUser(prisma: PrismaClient, data: LoginInput) {
  const user = await findUserByEmail(prisma, data);
  if (!user)
    return null;

  const isValid = verifyPassword(data.password, user.password, user.salt);
  if (!isValid)
      return null;
  
  const { password, salt, ...safeUser } = user;
  await prisma.user.update({
    where: { id: user.id },
    data: { isOnline: true, lastSeenAt: new Date()}
  });
  return safeUser;
}

export async function deleteUser(prisma: PrismaClient, id: string | undefined) {
  if (!id)
    return

  await prisma.session.deleteMany({
    where: { userId: id }
  });

  await prisma.user.delete({
    where: { id },
  });
}

export async function validateToken ( prisma: PrismaClient, token: string | undefined) {
  if (!token)
    throw new Error("Unauthorized: No token provided");

  const [scheme, credentials] = (token ?? '').split(' ');
  if (scheme !== 'Bearer' || !credentials)
     throw new Error("Unauthorized: Invalid token format");
    
  const session = await prisma.session.findUnique({
    where: { id: credentials },
    include: { user: true }
  });

  if (!session)
    throw new Error("Unauthorized: Invalid token");

  if (session.expiresAt < new Date())
    throw new Error("Unauthorized: Token expired");
  
  return session;
}
