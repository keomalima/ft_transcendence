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

// =====================
// Type Exports
// =====================

export type CreateGameInput = z.infer<typeof createGameSchema>;

// =====================
// Schema Objects Export
// =====================

export const gameSchemas = {
  // Request schemas
  request: {
	createGame: createGameSchema,
  },
  
  // Response schemas
  response: {
	createGame: createGameResponseSchema,
  },
};