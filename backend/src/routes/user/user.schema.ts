import { z } from "zod";
import type { MultipartFile } from '@fastify/multipart'

// =====================
// Request Schemas
// =====================

const multipartField = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val: any) => val?.value || val, schema);

const createUserSchema = z.object({
	email: multipartField(z.email()),
	name: multipartField(z.string().min(3)),
	password: multipartField(z.string()),
	surname: multipartField(z.string().nullable()),
	displayName: multipartField(z.string().min(3)),
	city: multipartField(z.string().min(3).nullable()),
	avatarFile: z
	.custom<MultipartFile>()
	.optional()
	.refine(
		(file) => !file || file.file?.bytesRead <= 10 * 1024 * 1024,
		{ message: 'The image must be a maximum of 10MB.' }
	)
	.refine(
		(file) => !file || file.mimetype.startsWith('image/'),
		{ message: 'Only images are allowed to be sent.' }
	),
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

const uploadSchema = z.object({
	avatarUrl: z
		.custom<MultipartFile>()
		.refine((file) => file?.file, {
			message: 'The image is required.',
		})
		.refine((file) => !file || file.file?.bytesRead <= 10 * 1024 * 1024, {
			message: 'The image must be a maximum of 10MB.',
		})
		.refine((file) => !file || file.mimetype.startsWith('image/'), {
			message: 'Only images are allowed to be sent.',
		}),
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
	id: z.string(),
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

const uploadAvatarResponseSchema = z.object({
	message: z.string(),
	filename: z.string(),
	avatarUrl: z.string(),
	mimetype: z.string()
});

// =====================
// Type Exports
// =====================

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EditInput = z.infer<typeof editUserSchema>;
export type UploadInput = z.infer<typeof uploadSchema>;
export type CreateUserData = Omit<CreateUserInput, 'avatarFile'> & {avatarUrl: string;}

// =====================
// Schema Objects Export
// =====================

export const userSchemas = {
  // Request schemas
  request: {
    createUser: createUserSchema,
    login: loginSchema,
    editUser: editUserSchema,
	uploadAvatar: uploadSchema
  },
  
  // Response schemas
  response: {
    createUser: createUserResponseSchema,
    login: loginResponseSchema,
    getUser: getUserResponseSchema,
    editUser: editUserResponseSchema,
	uploadtAvatar: uploadAvatarResponseSchema
  },
};
