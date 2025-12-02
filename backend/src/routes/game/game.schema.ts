import { z } from "zod";
import { GameStatus, GameMode } from "@prisma/client";

// =====================
// Request Schemas
// =====================

const createGameSchema = z.object({
	type: z.enum(GameMode),
	scoreToWin: z.number().int().max(10).optional()
});

const updateGameSchema = z.object({
	scoreToWin: z.number().int().optional()
});

// =====================
// Response Schemas
// =====================

const gameHistoryResponseSchema = z.array (
	z.object({
		gameId: z.string(),
		score: z.number().int(),
		isWinner: z.boolean(),
		duration: z.number().int(),
		type: z.enum(GameMode),
		status: z.enum(GameStatus),
		date: z.date(),
		opponent: z.object({
			id: z.string(),
			avatarUrl: z.string(),
			name: z.string(),
			score: z.number().int(),
			isWinner: z.boolean()
		})
	})
)


const createGameResponseSchema = z.object({
	id: z.string(),
	createdBy: z.string(),
	type: z.enum(GameMode),
	status: z.enum(GameStatus),
})

const getGameResponseSchema = z.object({
	id: z.string(),
	createdBy: z.string(),
	isCreator: z.boolean(),
	type: z.enum(GameMode),
	status: z.enum(GameStatus),
	token: z.string().nullable(),
	scoreToWin: z.number().int(),
	createdAt: z.date(),
	updatedAt: z.date().nullable(),
	completedAt: z.date().nullable(),
	startedAt: z.date().nullable(),
	gameUsers: z.array(
		z.object({
			id: z.string(),
			user: z.object({
				id: z.string(),
				displayName: z.string(),
				avatarUrl: z.string(),
			}),
			score: z.number().int(),
			isWinner: z.boolean(),
		})
	)
})

const generateGameTokenResponseSchema = z.object({
	id: z.string(),
	createdBy: z.string(),
	type: z.enum(GameMode),
	token: z.string()
})

const updateGameResponseSchema = z.object({
	id: z.string(),
	createdBy: z.string(),
	type: z.enum(GameMode),
	status: z.enum(GameStatus),
	scoreToWin: z.number().int()
})

const joinGameResponseSchema = z.object({
	id: z.string(),
	gameId: z.string(),
	userId: z.string(),
})

const getCurrentGameHandler = z.object({
	userId: z.string(),
	gameId: z.string(),
	type: z.enum(GameMode),
	status: z.enum(GameStatus),
	token: z.string()
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
	updateGame: updateGameSchema
  },
  
  // Response schemas
  response: {
	createGame: createGameResponseSchema,
	updateGame: updateGameResponseSchema,
	generateToken: generateGameTokenResponseSchema,
	getGame: getGameResponseSchema,
	joinGame: joinGameResponseSchema,
	startGame: updateGameResponseSchema,
	gameHistory: gameHistoryResponseSchema,
	currentGame: getCurrentGameHandler
  },
};