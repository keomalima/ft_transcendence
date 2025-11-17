import { PrismaClient } from "@prisma/client";
import type { CreateGameInput, UpdateGameInput } from "./game.schema.js";
import { includes } from "zod";

// =====================
// Game CRUD Operations
// =====================

async function findActiveGameByUserId(prisma: PrismaClient, id: string) {
	return prisma.gamePlayer.findFirst({
		where: {
			userId: id,
			game: {
				status: 'IN_PROGRESS'
			}
		},
	})
}

async function createGame(prisma: PrismaClient, data: CreateGameInput, id: string) {
	const game = await prisma.game.create({ data: { createdBy: id, ...data }});
	await prisma.gamePlayer.create({ data: { gameId: game.id, userId: id}})
	return game;
}

async function updateGame(prisma: PrismaClient, id: string, data: UpdateGameInput) {
  const updateData = Object.fromEntries(
	Object.entries(data).filter(([_, v]) => v !== undefined)
  );

  return prisma.game.update({
	where: { id: id },
	data: { ...updateData }
  });
}

// =====================
// Export Service Object
// =====================

export const gameService = {
	// Game operations
	createGame,
	updateGame,
	findActiveGameByUserId
};
