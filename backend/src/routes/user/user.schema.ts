import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export const userResponseSchema = createUserSchema.extend({
  id: z.number(),
});

export const usersResponseSchema = z.array(userResponseSchema);

// Tipos inferidos
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type User = z.infer<typeof userResponseSchema>;
