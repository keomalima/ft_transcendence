import { GameStatus, Prisma, PrismaClient } from "@prisma/client";
import type { CreateGameInput, FinishGameInput, UpdateGameInput } from "./game.schema.js";
import { includes } from "zod";
import { WaintingRoomWsController } from "../websockets/gameroom/waitingroom.ws.controller.js";
import { TournamentWsController } from "../websockets/tournament/tournament.ws.controller.js";

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

async function tryAdvanceTournament(prisma: PrismaClient,
	game: {
		tournamentId: string | null
		roundNumber: number
		matchNumber: number
		gameUsers: Array<{
			userId: string,
			displayName: string,
			isWinner: boolean
    	}>
		}
	) {

	if (!game) return;

	const winner = game.gameUsers.find((u: typeof game.gameUsers[0]) => u.isWinner);
	if (!winner) return;

	const nextGame = await prisma.game.findFirst({
		where: {
			tournamentId: game.tournamentId,
			roundNumber: game.roundNumber + 1,
			matchNumber: Math.ceil(game.matchNumber / 2)
		},
	})
	if (!nextGame) return;

	await prisma.gamePlayer.create({
		data:
			{ gameId: nextGame.id, userId: winner.userId }
	})

	const updatedNextGame = await prisma.game.findUnique({
		where: { id: nextGame.id },
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

	WaintingRoomWsController.broadcasToRoom(nextGame.id, {
		type: 'room_update',
		message: `${winner.displayName} joined the game!`,
		game: updatedNextGame
	})

	TournamentWsController.broadcasToRoom(nextGame.tournamentId!, {
		type: 'tournament_update',
		message: `Tournament update`,
		data: updatedNextGame
	})

	const remainingGamesInRound = await prisma.game.count({
		where: {
			tournamentId: game.tournamentId,
			roundNumber: game.roundNumber,
			status: { not: 'COMPLETED' }
		}
	});

	if (remainingGamesInRound === 0) {
		await prisma.tournament.update({
			where: { id: game.tournamentId },
			data: { currentRound: game.roundNumber + 1 }
		});
	}

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
