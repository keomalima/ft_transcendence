import { z } from "zod";
import { TournamentStatus, GameMode, GameStatus} from "@prisma/client";

// =====================
// Request Schemas
// =====================

const createTournamentSchema = z.object({
	numberPlayers: z.number().int(),
	scoreToWin: z.number().int().max(10).default(10)
});

const removePlayerRequestSchema = z.object({
	playerId: z.string()
});

// =====================
// Response Schemas
// =====================

const createTournamentGame = z.object({
	createdBy: z.string(),
	scoreToWin: z.number().int().max(10).default(10),
	tournamentId: z.string(),
	roundNumber: z.number().int(),
	matchNumber: z.number().int()
})

const createTournamentResponseSchema = z.object({
	id: z.string(),
	createdBy: z.string(),
	status: z.enum(TournamentStatus),

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

const getTournamentGames = z.array(
	z.object({
		id: z.string(),
		tournamentId: z.string(),
		status: z.enum(GameStatus),
		type: z.enum(GameMode),
		roundNumber: z.number().int(),
		matchNumber: z.number().int(),
		gameUsers: z.array(
			z.object({
				id: z.string(),
				score: z.number(),
				isWinner: z.boolean(),
				joinedAt: z.date(),
				user: z.object({
					id: z.string(),
					displayName: z.string(),
					isOnline: z.boolean(),
					avatarUrl: z.string(),
				})
			})
		)
	})
)

const getCurrentTournamentSchema = z.object({
	userId: z.string(),
	tournamentId: z.string(),
	status: z.enum(TournamentStatus),
	token: z.string().nullable(),
	totalRounds: z.number().int()
})

const startTournamentResponseSchema = z.object({
	id: z.string(),
	createdBy: z.string(),
	status: z.enum(TournamentStatus),
	scoreToWin: z.number().int(),
	totalRounds: z.number().int(),
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
export type CreateGameTournamentInput = z.infer<typeof createTournamentGame>;

// =====================
// Schema Objects Export
// =====================

export const tournamentSchemas = {
  // Request schemas
  request: {
	createTournament: createTournamentSchema,
	removePlayer: removePlayerRequestSchema,
  },
  
  // Response schemas
  response: {
	createTournament: createTournamentResponseSchema,
	getTournament: getTournamentResponseSchema,
	currentTournament: getCurrentTournamentSchema,
	generateToken: generateTournamentTokenResponseSchema,
	joinTournament: joinTournamentResponseSchema,
	startTournament: startTournamentResponseSchema,
	getTournamentGames: getTournamentGames
  },
};