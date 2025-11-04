import { PrismaClient } from "@prisma/client";
import type { CreateUserInput, LoginInput } from './user.schema.js';
import { hashPassowrd } from '../../utils/hash.js';

export async function findUser(prisma: PrismaClient, data: LoginInput) {

  return prisma.user.findUnique({
    where: {
      email: data.email,
    }
  });
}

export async function createUser(prisma: PrismaClient, data: CreateUserInput, salt: string, password: string) {
  return prisma.user.create({
    data: {
      ...data,
      salt,
      password
    },
  });
}

