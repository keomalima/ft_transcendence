import { GameStatus, Prisma, PrismaClient } from "@prisma/client";
import type { CreateGameInput, FinishGameInput, UpdateGameInput } from "./game.schema.js";
import { WaintingRoomWsController } from "../websockets/gameroom/waitingroom.ws.controller.js";
import { TournamentWsController } from "../websockets/tournament/tournament.ws.controller.js";

type FinishGamePlayer = FinishGameInput["gamePlayers"][number];

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

async function finishGame(prisma: PrismaClient, gameId: string, status: GameStatus) {
	console.log(`🏁 Finishing game ${gameId} with status: ${status}`);

	const existingGame = await prisma.game.findUnique({
        where: { id: gameId },
        select: { status: true }
    });
    
    if (existingGame?.status === 'COMPLETED' || existingGame?.status === 'ABANDONED') {
        return getCompleteGameData(prisma, gameId);
    }

	await prisma.game.update({
		where: { id: gameId },
		data: {
			status,
			completedAt: status === "COMPLETED" || status === 'ABANDONED' ? new Date() : null
		}
	})

	const game = await getGameWithTournamentInfo(prisma, gameId);
	if (game && game.tournamentId && game.tournament?.totalRounds) {
		const isLastRound = game.tournament.totalRounds === game.tournament.currentRound;

		// mark loser as elimina
		const winner = game.gameUsers.find((u: typeof game.gameUsers[0]) => u.isWinner);
		const loser = game.gameUsers.find((u: typeof game.gameUsers[0]) => !u.isWinner);

		if (!winner || !loser) return 

		await prisma.tournamentPlayer.update({
			where: {
				tournamentId_userId: {
					userId: loser.userId, 
					tournamentId: game.tournamentId
				}
			},
			data: {
				isEliminated: true,
				eliminatedInRound: game.tournament.currentRound
			}
		})

		if (isLastRound) {
			await completeTournament(prisma, game, winner);
		} else {
			await advanceToNextRound(prisma, game, winner);
		}
	}
	return getCompleteGameData(prisma, gameId);
}

async function advanceToNextRound(prisma: PrismaClient, game: any, winner: any) {
	console.log(`🏆 Tournament game detected: Tournament ${game.tournamentId}, Round ${game.roundNumber}`);

	const nextGame = await findNextBracketGame(prisma, game);
	if (!nextGame) return;

	await addWinnerToNextGame(prisma, nextGame.id, winner.userId);

	await notifyWaitingRoom(prisma, nextGame.id, winner.userId);

	await checkAndAdvanceRound(prisma, game.tournamentId, game.roundNumber);

	const completeGame = await getCompleteGameData(prisma, game.id);
	
	const nextCompleteGame = await getCompleteGameData(prisma, nextGame.id);

	TournamentWsController.broadcasToRoom(game.tournamentId!, {
		type: 'tournament_update',
		gameId: game.id,
		game: completeGame,
		nextGame: nextCompleteGame
	});
}

async function completeTournament(prisma: PrismaClient, game: any, winner: any) {
	await prisma.tournament.update({
		where: { id: game.tournamentId },
		data: {
			status: 'COMPLETED',
			completedAt: new Date(),
			winnerId: winner.userId
		}
	})
	console.log(`🎉 Tournament ${game.tournamentId} completed! Winner: ${winner.userId}`);

	TournamentWsController.broadcasToRoom(game.tournamentId!, {
		type: 'tournament_completed',
		tournamentId: game.tournamentId,
		winnerId: winner.userId
	});
}

// =====================
// Helpers Operations
// =====================

async function checkAndAdvanceRound(prisma: PrismaClient, tournamentId: string, currentRound: number) {
	const remainingGames = await prisma.game.count({
		where: {
			tournamentId,
			roundNumber: currentRound,
			status: { not: 'COMPLETED' }
		}
	});

	console.log(`🔍 Remaining games in round ${currentRound}: ${remainingGames}`);

	if (remainingGames === 0) {

		console.log(`⚡ ADVANCING ROUND: ${currentRound} → ${currentRound + 1} for tournament ${tournamentId}`);
		await prisma.tournament.update({
			where: { id: tournamentId },
			data: { currentRound: currentRound + 1 }
		});
		
		console.log(`🎯 Tournament ${tournamentId} advanced to round ${currentRound + 1}`);
	}
}

async function notifyWaitingRoom(prisma: PrismaClient, gameId: string, winnerId: string) {
	const updatedGame = await prisma.game.findUnique({
		where: { id: gameId },
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
	});

	if (!updatedGame) return;

	const winnerName = updatedGame.gameUsers.find((gu: any) => gu.user.id === winnerId)?.user.displayName;

	WaintingRoomWsController.broadcasToRoom(gameId, {
		type: 'room_update',
		message: `${winnerName} joined the game!`,
		game: updatedGame
	});
}

async function findNextBracketGame(
	prisma: PrismaClient,
		game: { tournamentId: string | null; roundNumber: number; matchNumber: number }
	) {

	return prisma.game.findFirst({
		where: {
			tournamentId: game.tournamentId,
			roundNumber: game.roundNumber + 1,
			matchNumber: Math.ceil(game.matchNumber / 2)
		}
	});
}

async function addWinnerToNextGame(prisma: PrismaClient, nextGameId: string, winnerId: string) {
	
	return prisma.gamePlayer.create({
		data: { gameId: nextGameId, userId: winnerId }
	});
}

async function getCompleteGameData(prisma: PrismaClient, gameId: string) {
	return prisma.game.findUnique({
		where: { id: gameId },
		include: {
			gameUsers: {
				include: {
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
	});
}

async function getGameWithTournamentInfo(prisma: PrismaClient, gameId: string) {
	return prisma.game.findFirst({
		where: { id: gameId },
		include: {
			gameUsers: { select: { userId: true, isWinner: true } },
			tournament: { select: { id: true, currentRound: true, totalRounds: true } }
		}
	});
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
