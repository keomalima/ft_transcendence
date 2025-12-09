import { z } from "zod";
import { TournamentStatus } from "@prisma/client";

// =====================
// Request Schemas
// =====================

const createTournamentSchema = z.object({
	numberPlayers: z.number().int(),
	scoreToWin: z.number().int().max(10).optional()
});

// =====================
// Response Schemas
// =====================

const createTournamentResponseSchema = z.object({
	id: z.string(),
	createdBy: z.string(),
	status: z.enum(TournamentStatus)
})

const getTournamentResponseSchema = z.object({
	id: z.string(),
	createdBy: z.string(),
	isCreator: z.boolean(),
	status: z.enum(TournamentStatus),
	numberPlayers: z.number().int(),
	totalRounds: z.number().int(),
	token: z.string().nullable(),
	scoreToWin: z.number().int(),
	createdAt: z.date(),
	updatedAt: z.date().nullable(),
	completedAt: z.date().nullable(),
	startedAt: z.date().nullable(),
	participants: z.array(
		z.object({
			id: z.string(),
			user: z.object({
				id: z.string(),
				displayName: z.string(),
				avatarUrl: z.string(),
			}),
			isEliminated: z.boolean()
		})
	)
})

const getCurrentTournamentSchema = z.object({
	userId: z.string(),
	tournamentId: z.string(),
	status: z.enum(TournamentStatus),
	token: z.string().nullable()
})

const generateTournamentTokenResponseSchema = z.object({
	id: z.string(),
	createdBy: z.string(),
	token: z.string()
})

const joinTournamentResponseSchema = z.object({
	id: z.string(),
	tournamentId: z.string(),
	userId: z.string(),
})


// =====================
// Type Exports
// =====================

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;

// =====================
// Schema Objects Export
// =====================

export const tournamentSchemas = {
  // Request schemas
  request: {
	createTournament: createTournamentSchema,
  },
  
  // Response schemas
  response: {
	createTournament: createTournamentResponseSchema,
	getTournament: getTournamentResponseSchema,
	currentTournament: getCurrentTournamentSchema,
	generateToken: generateTournamentTokenResponseSchema,
	joinTournament: joinTournamentResponseSchema
  },
};