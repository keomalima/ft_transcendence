import { PrismaClient } from "@prisma/client";
import type { CreateGameInput } from "./game.schema.js";

// =====================
// Game CRUD Operations
// =====================

async function createGame(prisma: PrismaClient, data: CreateGameInput, id: string) {
	return prisma.game.create({ data: { createdBy: id, ...data }});
}

// =====================
// Export Service Object
// =====================

export const gameService = {
	// Game operations
	createGame
};
