import { z } from "zod";

// =====================
// Request Schemas
// =====================

const createUserSchema = z.object({
  email: z.email(),
  name: z.string().min(3), 
  password: z.string(),
  surname: z.string().nullable(),
  displayName: z.string().min(3),
  avatarUrl: z.url().nullable(),
  city: z.string().min(3).nullable(),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string()
});

const editUserSchema = z.object({
  name: z.string().min(3).optional(),
  displayName: z.string().optional(),
  surname: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  city: z.string().nullable().optional()
});

// =====================
// Response Schemas
// =====================

const createUserResponseSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().min(3),
});

const loginResponseSchema = z.object({
  accessToken: z.string(),
  email: z.email(),
  name: z.string().min(3),
  isOnline: z.boolean(),
});

const getUserResponseSchema = z.object({
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
});

const editUserResponseSchema = z.object({
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
});

// =====================
// Type Exports
// =====================

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EditInput = z.infer<typeof editUserSchema>;

// =====================
// Schema Objects Export
// =====================

export const userSchemas = {
  // Request schemas
  request: {
    createUser: createUserSchema,
    login: loginSchema,
    editUser: editUserSchema,
  },
  
  // Response schemas
  response: {
    createUser: createUserResponseSchema,
    login: loginResponseSchema,
    getUser: getUserResponseSchema,
    editUser: editUserResponseSchema,
  },
};
