import { z } from "zod";
import { GameStatus, GameMode } from "@prisma/client";

// =====================
// Request Schemas
// =====================

const createGameSchema = z.object({
	type: z.enum(GameMode)
});

const createGameResponseSchema = z.object({
	id: z.string(),
	createdBy: z.string(),
	type: z.enum(GameMode),
	status: z.enum(GameStatus),
})

const updateGameSchema = z.object({
	status: z.enum(GameStatus).optional(),
	startedAt: z.coerce.date().optional(),
	completedAt: z.coerce.date().optional(),
	guestScore: z.int().optional()
});

const updateGameResponseSchema = z.object({
	id: z.string(),
	createdBy: z.string(),
	type: z.enum(GameMode),
	status: z.enum(GameStatus),
	startedAt: z.date(),
	completedAt: z.date(),
	guestScore: z.int()
})

// =====================
// Type Exports
// =====================

export type CreateGameInput = z.infer<typeof createGameSchema>;
export type UpdateGameInput = z.infer<typeof updateGameSchema>;

// =====================
// Schema Objects Export
// =====================

export const gameSchemas = {
  // Request schemas
  request: {
	createGame: createGameSchema,
	updateGame: updateGameSchema,
  },
  
  // Response schemas
  response: {
	createGame: createGameResponseSchema,
	updateGame: updateGameResponseSchema,
  },
};