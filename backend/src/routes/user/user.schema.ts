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

export const userResponseSchema = z.object({
  message: z.string(),
  id: z.string(),
  email: z.email(),
  name: z.string().min(3),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string()
})

export const loginResponseSchema = z.object({
  message: z.string(),
  accessToken: z.string(),
  email: z.email(),
  name: z.string().min(3),
})

export type CreateUserInput = z.infer<typeof createUserSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
