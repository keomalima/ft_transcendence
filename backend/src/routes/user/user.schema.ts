import { z } from "zod";

export const createUserSchema = z.object({
  email: z.email(),
  name: z.string().min(3),
  surname: z.string().nullable(),
  password: z.string().min(6),
  displayName: z.string().min(3),
  avatarUrl: z.url().nullable(),
  city: z.string().min(3).nullable(),
});

export const userResponseSchema = createUserSchema.extend({
  id: z.string(),
});

export const usersResponseSchema = z.array(userResponseSchema);

export type CreateUserInput = z.infer<typeof createUserSchema>;
