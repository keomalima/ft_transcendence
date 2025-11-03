import { PrismaClient } from "@prisma/client";
import type { CreateUserInput } from './user.schema.js';

export async function listUsers(prisma: PrismaClient) {
  return prisma.user.findMany();
}

export async function createUser(prisma: PrismaClient, data: CreateUserInput) {

  const existingUser = await prisma.user.findUnique({ 
    where: { email: data.email },
  });
  if (existingUser)
    throw new Error("User with this email already exists")
  return prisma.user.create({
    data,
  });
}

