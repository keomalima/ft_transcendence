import { PrismaClient } from "@prisma/client";
import type { CreateGameTournamentInput, CreateTournamentInput } from "./tournament.schema.js";

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

async function findTournamentByToken(prisma: PrismaClient, token: string) {
    return prisma.tournament.findUnique({
        where: {
            token
        },
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

async function findTournamentByUserId(prisma: PrismaClient, userId: string, tournamentId: string) {
	return prisma.tournament.findFirst({
		where: {
			id: tournamentId,
			createdBy: userId
		},
		include: {
            participants: {
                include: {
                    user: {
                        select: {
                            id: true,
                            displayName: true
                        }
                    }
                }
            }
        }
	});
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

async function createTournamentGame(prisma: PrismaClient, data: CreateGameTournamentInput) {
	return prisma.game.create({ data })
}

async function generateToken(prisma: PrismaClient, tournamentId: string, token: string) {
	return prisma.tournament.update({
		where: { id: tournamentId },
		data: { token }
	})
}

async function joinUserToTournament(prisma: PrismaClient, tournamentId: string, userId: string) {
	return prisma.tournamentPlayer.create({ data: { tournamentId, userId}})
}

async function removePlayerFromTournament(prisma: PrismaClient, tournamentId: string, userId: string) {
	return prisma.tournamentPlayer.delete({
		where: {
			tournamentId_userId: {
				tournamentId,
				userId,
			},
		}
	})
}

async function deletePendingTournament(prisma: PrismaClient, tournamentId: string) {
	return prisma.tournament.delete({
		where: {
			id: tournamentId
		}
	})
}

async function startTournament(prisma: PrismaClient, tournamentId: string) {
	return prisma.tournament.update({
		where: { id: tournamentId },
		data: {
			status : "IN_PROGRESS"
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
	findTournamentById,
	findTournamentByUserId,
	findTournamentByToken,
	generateToken,
	joinUserToTournament,
	removePlayerFromTournament,
	deletePendingTournament,
	startTournament,
	createTournamentGame
};