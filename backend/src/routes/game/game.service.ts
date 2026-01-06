import { GameStatus, Prisma, PrismaClient } from "@prisma/client";
import type { CreateGameInput, FinishGameInput, UpdateGameInput } from "./game.schema.js";
import { includes } from "zod";

// =====================
// Game CRUD Operations
// =====================

async function getGamesByUserId(prisma: PrismaClient, userId: string) {
	return prisma.gamePlayer.findMany({
		where: { userId },
		orderBy: {
			game: { startedAt: 'desc' }
		},
		include: {
			game: {
				include : {
					gameUsers: {
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
			}
		}
	})

}

async function findGameById(prisma: PrismaClient, gameId: string) {
	return prisma.game.findUnique({
		where: { id: gameId },
		include: {
			gameUsers: {
				include: {
					user: {
						select: {
                        	id: true,
                        	displayName: true,
							avatarUrl: true,
                    	}
					}
				}
			}
		}
	});
}

async function findGameByToken(prisma: PrismaClient, token: string) {
    return prisma.game.findUnique({
        where: {
            token
        },
        include: {
            gameUsers: {
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

async function findGameByUserId(prisma: PrismaClient, userId: string, gameId: string) {
	return prisma.game.findFirst({
		where: {
			id: gameId,
			createdBy: userId
		},
		include: {
            gameUsers: {
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

async function findActiveGameByUserId(prisma: PrismaClient, id: string) {
	return prisma.gamePlayer.findFirst({
		where: {
			userId: id,
			game: {
				status: {in: ['IN_PROGRESS', 'PENDING']}
			}
		},
		include: {
			game : {
				select: {
					token: true,
					status: true,
					type: true,
				}
			}
		}
	})
}

async function removePlayerFromGame(prisma: PrismaClient, gameId: string, userId: string) {
	return prisma.gamePlayer.delete({
		where: {
			gameId_userId: {
				gameId,
				userId,
			},
		}
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

async function generateToken(prisma: PrismaClient, gameId: string, token: string) {
	return prisma.game.update({
		where: { id: gameId },
		data: { token }
	})
}

async function joinUserToGame(prisma: PrismaClient, gameId: string, userId: string) {
	return prisma.gamePlayer.create({ data: { gameId, userId}})
}

async function startGame(prisma: PrismaClient, gameId: string, userId: string) {
	const game = await findGameById(prisma, gameId);
	
	if (game?.type === 'LOCAL') {
		// Find or create the guest user for local games
		let guestUser = await prisma.user.findUnique({
			where: { displayName: `guest${userId}` }
		});
		
		if (!guestUser) {
			guestUser = await prisma.user.create({
				data: {
					email: `guest${userId}@local.game`,
					name: 'Guest',
					displayName: `guest${userId}`,
					password: 'N/A',
					salt: 'N/A',
					avatarUrl: '/default-avatar.png'
				}
			});
		}
		
		// Add guest as second player
		await prisma.gamePlayer.create({
			data: {
				gameId,
				userId: guestUser.id
			}
		});
	}
	
	return prisma.game.update({
		where: { id: gameId },
		data: {
			status: "IN_PROGRESS",
			startedAt: new Date()
		}
	});
}

async function deletePendingGame(prisma: PrismaClient, gameId: string) {
	return prisma.game.delete({
		where: {
			id: gameId
		}
	})
}

async function finishGame(prisma: PrismaClient, gameId: string, status: GameStatus) {
	console.log(`🏁 Finishing game ${gameId} with status: ${status}`); // ✅ Entry point

	const game = await prisma.game.findFirst({
		where: { id: gameId },
		include: {
			gameUsers: {
				select: {
					userId: true,
					isWinner: true
				}
			},
			tournament : {
				select: {
					id: true,
					currentRound: true,
					totalRounds: true,
				}
			}
		}
	});

	await prisma.game.update({
		where: { id: gameId },
		data: {
			status,
			completedAt: status === "COMPLETED" || status === 'ABANDONED' ? new Date() : null
		}
	})
	
	if (game?.tournamentId && game.tournament.totalRounds > game.tournament.currentRound) {
	    console.log(`🏆 Tournament game detected: Tournament ${game.tournamentId}, Round ${game.roundNumber}, Match ${game.matchNumber}`);
		await tryAdvanceTournament(prisma, game);
	} else if (game?.tournamentId && game.tournament.totalRounds === game.tournament.currentRound) {
		const winner = game.gameUsers.find((u: typeof game.gameUsers[0]) => u.isWinner);

		if (winner) {
			await prisma.tournament.update({
				where: { id: game.tournamentId },
				data: {
					status: 'COMPLETED',
					completedAt: new Date(),
					winnerId: winner.userId
				}
			});
			console.log(`🎉 Tournament ${game.tournamentId} completed! Winner: ${winner.userId}`);
		}
	}

	return prisma.game.findFirst({
		where: { id: gameId },
		include: {
			gameUsers: {
				select: {
					id: true, 
					score: true,
					isWinner: true
				}
			}
		}
	})
}

async function tryAdvanceTournament(
	prisma: PrismaClient, 
	finishedGame: {
		id: string
		tournamentId: string | null
		roundNumber: number
		matchNumber: number
		scoreToWin: number
		createdBy: string
		gameUsers: Array<{
			userId: string
			isWinner: boolean
    	}>
		}
	) {
	console.log(`🔄 Attempting tournament advancement for Tournament ${finishedGame.tournamentId}`);
	if (!finishedGame.tournamentId) return;

	await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
		const pairMatchNumber = finishedGame.matchNumber % 2 === 0
		? finishedGame.matchNumber - 1
		: finishedGame.matchNumber + 1;

		console.log(`🔍 Looking for pair game: Round ${finishedGame.roundNumber}, Match ${pairMatchNumber}`);
		const pairGame = await tx.game.findFirst({
			where: {
				tournamentId: finishedGame.tournamentId,
				roundNumber: finishedGame.roundNumber,
				matchNumber: pairMatchNumber,
				status: { in: ['COMPLETED', 'ABANDONED']}
			},
			include: {
				gameUsers: { select: {userId: true, isWinner: true }}
			}
		})
		
		if (!pairGame){
			console.log(`⏳ Pair game not finished yet - waiting for Match ${pairMatchNumber} to complete`);
			return;
		}

		console.log(`✅ Pair game found (${pairGame.id}) - both games complete`);
		const nextRound = finishedGame.roundNumber + 1;
		const nextMatch = Math.ceil(finishedGame.matchNumber / 2);

		console.log(`➡️ Checking for existing game in Round ${nextRound}, Match ${nextMatch}`);
		const existingGame = await tx.game.findFirst({
			where: {
				tournamentId: finishedGame.tournamentId, 
				roundNumber: nextRound,
				matchNumber: nextMatch
			}
		})

		if (existingGame) {
			console.log(`⏭️ Next round game already exists (${existingGame.id}) - skipping creation`)
			return;
		}

		const winner1 = finishedGame.gameUsers.find((u: typeof finishedGame.gameUsers[0]) => u.isWinner);
  		const winner2 = pairGame.gameUsers.find((u: typeof pairGame.gameUsers[0]) => u.isWinner);

		if (!winner1 || !winner2) return;

		console.log(`👥 Creating next round game with winners: ${winner1.userId} vs ${winner2.userId}`);
		const newGame = await tx.game.create({ data: {
			createdBy: finishedGame.createdBy, 
			type: 'TOURNAMENT',
			scoreToWin: finishedGame.scoreToWin || pairGame.scoreToWin,
			tournamentId: finishedGame.tournamentId,
			roundNumber: nextRound,
			matchNumber: nextMatch,
		}})
		
		await tx.gamePlayer.createMany({
			data: [
				{ gameId: newGame.id, userId: winner1.userId },
				{ gameId: newGame.id, userId: winner2.userId }
			]
		})

		await tx.tournament.update({
			where: {id: finishedGame.tournamentId},
			data: { currentRound: nextRound }
		})
		console.log(`🎉 Successfully created next round game: ${newGame.id} (Round ${nextRound}, Match ${nextMatch})`);
		console.log(`📊 Updated tournament to Round ${nextRound}`);
	})
}

type FinishGamePlayer = FinishGameInput["gamePlayers"][number];

async function findGamePlayerById(prisma: PrismaClient, playerId: string) {
	return prisma.gamePlayer.findUnique({
		where: { id: playerId },
		select: { id: true, gameId: true }
	});
}

async function updatePlayer(prisma: PrismaClient, player: FinishGamePlayer, isWinner: boolean) {
	return prisma.gamePlayer.update({
		where: { id: player.playerId },
		data: {
			score: player.score,
			isWinner,
		}
	})
}

// =====================
// Export Service Object
// =====================

export const gameService = {
	// Game operations
	createGame,
	updateGame,
	findActiveGameByUserId,
	generateToken,
	findGameByUserId,
	findGameById,
	findGameByToken,
	joinUserToGame,
	startGame,
	getGamesByUserId,
	removePlayerFromGame,
	deletePendingGame,
	finishGame,
	updatePlayer,
	findGamePlayerById
};
