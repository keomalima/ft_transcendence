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
			},
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
	const game = await prisma.game.create({ data: { createdBy: id, ...data, scoreToWin: data.scoreToWin ?? null }});
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
	
	const updatedGame = await  prisma.game.update({
		where: { id: gameId },
		data: {
			status: "IN_PROGRESS",
			startedAt: new Date()
		}
	});

	if (game?.tournamentId)
		notifyTournament(prisma, game.tournamentId, updatedGame.id, null);

	return updatedGame;
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

async function updatePlayer(prisma: PrismaClient, playerId: string, score: number, isWinner: boolean) {
	console.log('updating player', playerId, isWinner)
	return prisma.gamePlayer.update({
		where: { id: playerId },
		data: {
			score: score,
			isWinner,
		}
	})
}

async function findGamePlayerByUserAndGameId(prisma: PrismaClient, userId: string, gameId: string) {
	return prisma.gamePlayer.findUnique({
		where: {
			gameId_userId : {
				gameId,
				userId
			}
		},
		select: { id: true, gameId: true }
	})
}

async function updateParticipantEliminated(prisma: PrismaClient, userId: string, tournamentId: string, eliminatedInRound: number) {
	return await prisma.tournamentPlayer.update({
		where: {
			tournamentId_userId: {
				userId,
				tournamentId
			}
		},
		data: {
			isEliminated: true,
			eliminatedInRound
		}
	})
}

async function finishGame(prisma: PrismaClient, gameId: string, data: FinishGameInput) {
	const { status, gamePlayers, winnerId } = data;

	const existingGame = await findGameById(prisma, gameId);
	
    if (existingGame?.status === 'COMPLETED' || existingGame?.status === 'ABANDONED') {
        return getCompleteGameData(prisma, gameId);
    }

	for (const player of gamePlayers) {
		const gp = await findGamePlayerByUserAndGameId(prisma, player.userId, gameId);
		if (!gp && gp?.gameId !== gameId) {
			throw new Error("Player does not belong to the game");
		}
		const isWinner = gp.id === winnerId;
		await updatePlayer(prisma, gp.id, player.score, isWinner);
	}

	await updateGame(prisma, gameId, {status, completedAt: status === "COMPLETED" || status === 'ABANDONED' ? new Date() : null});

	const game = await getGameWithTournamentInfo(prisma, gameId);
	if (game && game.tournamentId && game.tournament?.totalRounds) {
		const isLastRound = game.tournament.totalRounds === game.tournament.currentRound;

		// mark loser as eliminated
		const winner = game.gameUsers.find((u: typeof game.gameUsers[0]) => u.isWinner);
		const loser = game.gameUsers.find((u: typeof game.gameUsers[0]) => !u.isWinner);

		if (!winner || !loser) return ;

		await updateParticipantEliminated(prisma, loser.userId, game.tournamentId, game.tournament.currentRound);

		if (isLastRound) {
			await completeTournament(prisma, game.tournamentId!, game.id, winner);
		} else {
			await advanceToNextRound(prisma, game, winner);
		}
	}
	
	return getCompleteGameData(prisma, gameId);
}

async function advanceToNextRound(prisma: PrismaClient, game: any, winner: any) {
	const nextGame = await findNextBracketGame(prisma, game);
	if (!nextGame) return;

	let currentGame: typeof nextGame | null = nextGame;

	await addWinnerToNextGame(prisma, nextGame.id, winner.userId);
	await checkAndAdvanceRound(prisma, game.tournamentId, game.roundNumber);

	while (currentGame?.status === 'ABANDONED' && currentGame.roundNumber && currentGame.matchNumber !== null) {
		await notifyTournament(prisma, game.tournamentId!, game.id, currentGame.id);
		await markPlayerWinner(prisma, currentGame.id, winner.userId);

		const abandonedRound = currentGame.roundNumber;

		const nextBracketGame = await findNextBracketGame(prisma, {
			tournamentId: currentGame.tournamentId,
			roundNumber: currentGame.roundNumber!,
			matchNumber: currentGame.matchNumber!
		});

		currentGame = nextBracketGame;
		if (!currentGame) break;

		await checkAndAdvanceRound(prisma, game.tournamentId, abandonedRound);
		await addWinnerToNextGame(prisma, currentGame.id, winner.userId);
	}

	if (currentGame && currentGame.status === 'PENDING') {
	    await notifyWaitingRoom(prisma, currentGame.id, winner.userId);
		await notifyTournament(prisma, game.tournamentId!, game.id, currentGame.id);
	} else {
	    await completeTournament(prisma,game.tournamentId!, game.id, winner);
	}
}

async function notifyTournament(prisma: PrismaClient, tournamentId: string, gameId: string, currentGameId: string | null) {
	const completeGame = await getCompleteGameData(prisma, gameId);
	let nextCompleteGame = null;
	if (currentGameId)
    	nextCompleteGame = await getCompleteGameData(prisma, currentGameId);

	TournamentWsController.broadcastToRoom(tournamentId, {
		type: 'tournament_update',
		gameId: gameId,
		game: completeGame,
		nextGame: nextCompleteGame
	});
}

async function completeTournament(prisma: PrismaClient, tournamentId: string, gameId: string, winner: any) {
	const tournamentUpdated = await prisma.tournament.update({
		where: { id: tournamentId },
		data: {
			status: 'COMPLETED',
			completedAt: new Date(),
			winnerId: winner.userId
		},
		include :{
			winner: {
				select: {
					id: true,
					displayName: true,
					avatarUrl: true
				}
			}
		}
	})

	// console.log(`🎉 Tournament ${tournamentId} completed! Winner: ${winner.userId}`);

	const completeGame = await getCompleteGameData(prisma, gameId);
	TournamentWsController.broadcastToRoom(tournamentId, {
		type: 'tournament_ended',
		gameId: gameId,
		game: completeGame,
		nextGame: completeGame,
		tournamentData: tournamentUpdated
	});
}

// =====================
// Helpers Operations
// =====================

async function markPlayerWinner(prisma: PrismaClient, gameId: string, winnerId: string) {
	return prisma.gamePlayer.update({
		where : {
			gameId_userId :{
				userId: winnerId,
				gameId
			}
		},
		data: {
			isWinner: true
		}
	})
}
async function checkAndAdvanceRound(prisma: PrismaClient, tournamentId: string, currentRound: number) {
	const remainingGames = await prisma.game.count({
		where: {
			tournamentId,
			roundNumber: currentRound,
			status: { notIn: ['COMPLETED', 'ABANDONED'] }
		}
	});

	// console.log(`🔍 Remaining games in round ${currentRound}: ${remainingGames}`);

	if (remainingGames === 0) {

		// console.log(`⚡ ADVANCING ROUND: ${currentRound} → ${currentRound + 1} for tournament ${tournamentId}`);
		await prisma.tournament.update({
			where: { id: tournamentId },
			data: { currentRound: currentRound + 1 }
		});
		
		// console.log(`🎯 Tournament ${tournamentId} advanced to round ${currentRound + 1}`);
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
		game: updatedGame,
		nextGame: updatedGame
	});
}

async function findNextBracketGame(
	prisma: PrismaClient,
		game: { tournamentId: string | null; roundNumber: number; matchNumber: number }
	) {

	// console.log('=====Findin next game with round ', game.roundNumber);
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
	findGamePlayerById,
	getCompleteGameData
};
