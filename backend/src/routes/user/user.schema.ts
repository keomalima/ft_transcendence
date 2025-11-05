import { z } from "zod";

export const createUserSchema = z.object({
  email: z.email(),
  name: z.string().min(3), 
  password: z.string(),
  surname: z.string().nullable(),
  displayName: z.string().min(3),
  avatarUrl: z.url().nullable(),
  city: z.string().min(3).nullable(),
});

export const createUserResponseSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().min(3),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string()
})

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  email: z.email(),
  name: z.string().min(3),
  isOnline: z.boolean(),
})

export const getUserResponseSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().min(3),
  displayName: z.string(),
  surname: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  city: z.string().nullable(),
  isOnline: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const editUserSchema = z.object({
  name: z.string().min(3).optional(),
  displayName: z.string().optional(),
  surname: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  city: z.string().nullable().optional()
})

export const editUserResponseSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().min(3),
  displayName: z.string(),
  surname: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  city: z.string().nullable(),
  isOnline: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>;

export type LoginInput = z.infer<typeof loginSchema>;

export type EditInput = z.infer<typeof editUserSchema>;
