import { PrismaClient } from "@prisma/client";
import type { CreateTournamentInput } from "./tournament.schema.js";

// =====================
// Tournament CRUD Operations
// =====================

async function createTournament(prisma: PrismaClient, data: CreateTournamentInput, id: string, totalRounds: number) {
	const tournament = await prisma.tournament.create({ data: { createdBy: id, totalRounds, ...data }});
	await prisma.tournamentPlayer.create({ data: { tournamentId: tournament.id, userId: id}})
	return tournament;
}

async function findActiveTournamentByUserId(prisma: PrismaClient, id: string) {
	return prisma.tournamentPlayer.findFirst({
		where: {
			userId: id,
			tournament: {
				status: {in: ['REGISTRATION', 'READY', 'IN_PROGRESS']}
			}
		},
		include: {
			tournament : {
				select: {
					token: true,
					status: true,
				}
			}
		}
	})
}

async function findTournamentById(prisma: PrismaClient, tournamentId: string){
	return prisma.tournament.findUnique({
		where: { id: tournamentId},
		include: {
			participants: {
				include: {
					user: {
						select: {
							id: true,
							displayName: true,
							avatarUrl: true
						}
					}
				}
			}
		}
	})
}

// =====================
// Export Service Object
// =====================

export const tournamentService = {
	// Tournament operations
	createTournament,
	findActiveTournamentByUserId,
	findTournamentById
};