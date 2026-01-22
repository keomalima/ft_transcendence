import { Prisma, PrismaClient } from "@prisma/client";
import type { CreateGameTournamentInput, CreateTournamentInput, Tournament } from "./tournament.schema.js";

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
			},
			isQuit: false
		},
		include: {
			tournament : {
				select: {
					token: true,
					status: true,
					totalRounds: true,
					currentRound: true,
					winner: {
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

async function findTournamentByParticipant(prisma: PrismaClient, userId: string, tournamentId: string) {
	return prisma.tournamentPlayer.findUnique({
		where: { 
			tournamentId_userId: {
				tournamentId,
				userId
			}
		},
		include: {
			tournament: {
				select: {
					id: true,
					status: true
				}
			},
			user: {
				select: {
					id: true,
					displayName: true,
				}
			}
		} 
	})
}

async function quitTournamentByParticipantId(prisma: PrismaClient, participantId: string) {
	return prisma.tournamentPlayer.update({
		where: { id: participantId},
		data: {
			isQuit: true
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
			},
			winner: {
				select : {
					id: true,
					displayName: true,
					avatarUrl: true
				}
			}
		}
	})
}

async function findTournamentGames(prisma: PrismaClient, tournamentId: string) {
	return prisma.game.findMany({
		where: { tournamentId },
		select: {
			id: true,
			tournamentId: true,
			status: true,
			type: true,
			roundNumber: true,
			matchNumber: true,
			gameUsers: {
				select: {
					id: true,
					score: true,
					isWinner: true,
					joinedAt: true,
					isReady: true,
					user: {
						select: {
							id: true,
							displayName: true,
							isOnline: true,
							avatarUrl: true
						}
					}
				}
			}
		}
	})
}

async function createTournamentGame(prisma: PrismaClient, data: CreateGameTournamentInput) {
	return prisma.game.create({ data: {type: "TOURNAMENT", ...data}})
}

async function generateToken(prisma: PrismaClient, tournamentId: string, token: string) {
	return prisma.tournament.update({
		where: { id: tournamentId },
		data: { token }
	})
}

async function joinUserToTournament(prisma: PrismaClient, tournamentId: string, userId: string) {
    return prisma.tournamentPlayer.create({ 
        data: { tournamentId, userId },
        include: {
            user: {
                select: {
                    id: true,
                    displayName: true,
                    avatarUrl: true
                }
            }
        }
    })
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
			status : "READY"
		}
	})
}

async function findOpponentByGameId(prisma: PrismaClient, gameId: string, userId: string) {
	return prisma.gamePlayer.findFirst({
		where: {
			gameId,
			NOT :{
				userId
			}
		}
	})
}

async function markPlayerReadyByGamePlayerId(prisma: PrismaClient, gamePlayerId: string) {
	return prisma.gamePlayer.update({
		where: {
			id: gamePlayerId
		},
		data: {
			isReady: true,
		}
	})
}

async function findGameByRoundNMatch(prisma: PrismaClient, tournamentId: string, roundNumber: number, matchNumber: number) {
	return prisma.game.findFirst({
		where: {
			tournamentId,
			roundNumber,
			matchNumber
		}
	})
}

async function matchMakeGames(prisma: PrismaClient, userId: string, tournament: Tournament) {
	return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
		const shuffled = [...tournament.participants];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const temp = shuffled[i]!;
			shuffled[i] = shuffled[j]!;
			shuffled[j] = temp;
		}

		for (let i = 0; i < shuffled.length; i += 2) {
			const first = shuffled[i];
			const second = shuffled[i + 1];
			if (!first || !second) {
				throw new Error("Unexpected missing participant while pairing");
			}
			const game = await tx.game.create({ data: {
				createdBy: userId, 
				type: 'TOURNAMENT',
				scoreToWin: tournament.scoreToWin,
				tournamentId: tournament.id,
				roundNumber: 1,
				matchNumber: i/2 + 1,
			}})
			await tx.gamePlayer.createMany({
				data: [
					{ gameId: game.id, userId: first.user.id },
					{ gameId: game.id, userId: second.user.id }
				]
			})
		}
		await tx.tournament.update({ where: { id: tournament.id}, data: { status: 'IN_PROGRESS' }})
	})
}

async function createEmptyGames(prisma: PrismaClient, userId: string, tournament: Tournament) {
	return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
		const totalParticipants = tournament.participants.length;

		for (let i = 2; i <= tournament.totalRounds; i++) {
			const gamesInRound = totalParticipants / Math.pow(2, i);
			for (let j = 1; j <= gamesInRound; j++) {
				await tx.game.create({ data: {
					createdBy: userId,
					type: 'TOURNAMENT',
					scoreToWin: tournament.scoreToWin,
					tournamentId: tournament.id,
					roundNumber: i,
					matchNumber: j
				}})
			}
		}
	})
}

async function findCurrentGameByUserTournamentId(prisma: PrismaClient, userId: string, tournamentId: string) {
	return prisma.game.findFirst({
		where: {
			gameUsers: { 
				some: {
					userId
				} 
			},
			tournament: { id: tournamentId },
			status: {in: ['PENDING']}
		},
		include: {
			gameUsers: true
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
	createTournamentGame,
	findTournamentByParticipant,
	findTournamentGames,
	findOpponentByGameId,
	markPlayerReadyByGamePlayerId,
	findGameByRoundNMatch,
	matchMakeGames,
	createEmptyGames,
	quitTournamentByParticipantId,
	findCurrentGameByUserTournamentId
};
