import type { FastifyReply, FastifyRequest } from 'fastify'
import { Prisma } from '@prisma/client'
import { tournamentService } from './tournament.service.js';
import type { CreateTournamentInput } from './tournament.schema.js';
import crypto from 'crypto';
import { WaintingRoomWsController } from '../websockets/gameroom/waitingroom.ws.controller.js';
import { gameService } from '../game/game.service.js';
import { TournamentWsController } from '../websockets/tournament/tournament.ws.controller.js';

// =====================
// Tournament CRUD Handlers
// =====================

async function createTournamentHandler (request: FastifyRequest<{ Body: CreateTournamentInput }>, reply: FastifyReply) {
	try {
		const body = request.body;
		const userId = request.user!.id;

		const isGameOn = await gameService.findActiveGameByUserId(request.server.prisma, request.user!.id);
		if (isGameOn) {
			return reply.code(400).send({
				message: "User currently has an active game on"
			});
		}
		
		if (body.numberPlayers < 2 || body.numberPlayers % 2 !== 0) {
			return reply.code(400).send({
				message: "Invalid number of players"
			});
		}

		const totalRounds = Math.ceil(Math.log2(body.numberPlayers));

		const tournament = await tournamentService.findActiveTournamentByUserId(request.server.prisma, request.user!.id);
		if (tournament) {
			const isParticipantEliminated = await tournamentService.findTournamentByParticipant(request.server.prisma, userId, tournament.tournamentId);
			if (!isParticipantEliminated?.isQuit) {
					return reply.code(400).send({
					message: "User currently has an active tournament on"
				});
			}
		}
		const newGame = await tournamentService.createTournament(request.server.prisma, body, userId, totalRounds);
		return reply.code(201).send(newGame);
	} catch (error: any) {
		// console.log(error);
		reply.code(500).send({ message: "Failed to create tournament"});
	}
}

async function generateTokenHandler (request: FastifyRequest<{ Params: { id: string} }>, reply: FastifyReply) {
	try {
		let attempts = 0;
		const maxAttempts = 10;

		const userId = request.user!.id;
		const tournamentId = request.params.id;
		const tournament = await tournamentService.findTournamentByUserId(request.server.prisma, userId, tournamentId)
		if (!tournament) {
			return reply.code(404).send({
				message: "Tournament not found or unauthorized"
			});
		}
		if (tournament.token) {
			return reply.code(400).send({
				message: "Tournament already has a valid token",
				token: tournament.token
			});
		}
		while (attempts < maxAttempts) {
			const token = generateTournamentToken();
			const existingTournament = await tournamentService.findTournamentByToken(request.server.prisma, token);
			if (!existingTournament){
				return await tournamentService.generateToken(request.server.prisma, tournamentId, token);
			}
			attempts++;
		}
		return reply.code(500).send({ message: "Failed to generate unique token" });
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to generate a token"});
	}
}

async function getTournamentHandler (request: FastifyRequest<{Params: { id: string }}>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const tournamentId = request.params.id;
		const tournament = await tournamentService.findTournamentById(request.server.prisma, tournamentId);
		if (!tournament) {
			return reply.code(404).send({
            	message: "Tournament not found or unauthorized"
        	});
		}
		const response = {
			...tournament,
			isCreator: tournament.createdBy === userId,
			token: tournament.createdBy === userId ? tournament.token : null,
			winner: tournament.winner ? {
				id: tournament.winner.id,
				displayName: tournament.winner.displayName,
				avatarUrl: tournament.winner.avatarUrl
			} : null
		}
		return response;
	} catch (error:any) {
		// console.log(error);
		reply.code(500).send({ message: "Failed to get tournament"});
	}
}

async function joinTournamentHandler (request: FastifyRequest<{ Params: { token: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const joinedUser = request.user!;
		const token = request.params.token;

		const isGameOn = await gameService.findActiveGameByUserId(request.server.prisma, request.user!.id);
		if (isGameOn) {
			return reply.code(400).send({
				message: "Can not join, user currently has an active game on"
			});
		}

		const tournament = await tournamentService.findTournamentByToken(request.server.prisma, token);
		if (!tournament) {
			return reply.code(404).send({
				message: "Tournament not found"
			});
		}
		if (tournament.status !== "REGISTRATION") {
			return reply.code(409).send({
				message: "Cannot join, tournament has already started"
			});
		}
		if (tournament.participants.length >= tournament.numberPlayers) {
			return reply.code(409).send({
				message: "Tournament is already full"
			});
		}
		
		for (const participant of tournament.participants) {
			if (participant.user.id === userId) {
				return reply.code(409).send({
					message: "User is already in this tournament"
				});
			}
		}

		const activeTournament = await tournamentService.findActiveTournamentByUserId(request.server.prisma, request.user!.id);
		if (activeTournament) {
			const isParticipantEliminated = await tournamentService.findTournamentByParticipant(request.server.prisma, userId, activeTournament.tournamentId);
			if (!isParticipantEliminated?.isQuit) {
					return reply.code(400).send({
					message: "User currently has an active tournament on"
				});
			}
		}

		const createdPlayer = await tournamentService.joinUserToTournament(request.server.prisma, tournament.id, userId);

		WaintingRoomWsController.broadcasToRoom(tournament.id, {
			type: 'room_update',
			message: `${joinedUser.displayName} joined the tournament!`,
			player: createdPlayer
		})

		return createdPlayer;
	} catch (error: any) {
		// console.error(error);
		reply.code(500).send({ message: "Failed to join tournament"});
	}
}

async function getCurrentTournamentHandler(request: FastifyRequest, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const tournament = await tournamentService.findActiveTournamentByUserId(request.server.prisma, userId);
		if (!tournament) 
			return reply.code(204).send();

		const response: any = {
			userId: tournament.userId,
			tournamentId: tournament.tournamentId,
			status: tournament.tournament.status,
			token: tournament.tournament.token,
			totalRounds: tournament.tournament.totalRounds,
			currentRound: tournament.tournament.currentRound,
			winner: tournament.tournament.winner ? {
				id: tournament.tournament.winner.id,
				displayName: tournament.tournament.winner.displayName,
				avatarUrl: tournament.tournament.winner.avatarUrl
			} : null
		};

		return response;
	} catch (error:any) {
		// console.log(error);
		reply.code(500).send({ message: "Failed to fetch current tournament"});
	}
}

async function removePlayerHandler (request: FastifyRequest<{ Params: { id: string}, Body: {playerId: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const tournamentId = request.params.id;
		const playerId = request.body.playerId;

		const tournament = await tournamentService.findTournamentByUserId(request.server.prisma, userId, tournamentId);
		if (!tournament) {
			return reply.code(404).send({
				message: "Tournament not found or unauthorized"
			});
		}
		if (tournament.status !== "REGISTRATION"){
			return reply.code(400).send({
				message: "Can not remove a player"
			});
		}

		WaintingRoomWsController.broadcasToRoom(tournamentId, {
			type: 'player_remove',
			message: `${userId} was removed from tournament!`,
			playerId,
		})
		await tournamentService.removePlayerFromTournament(request.server.prisma, tournamentId, playerId);
		reply.code(204).send();
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to remove player from tournament"});
	}
}

async function deletePendingTournamentHandler (request: FastifyRequest<{ Params: { id: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const tournamentId = request.params.id;

		const tournament = await tournamentService.findTournamentById(request.server.prisma, tournamentId);
		if (!tournament) {
			return reply.code(404).send({
				message: "Tournament not found or unauthorized"
			});
		}
		if (tournament.status !== 'REGISTRATION') {
			return reply.code(400).send({
				message: "Can not delete tournament"
			});
		}
		if (tournament.createdBy === userId) {
			// console.log('🔥 notify closed tournament (BY CREATOR)');
			WaintingRoomWsController.notifyTournamentClosed(tournamentId, userId);
			await tournamentService.deletePendingTournament(request.server.prisma, tournamentId);
			return reply.code(204).send();
		} else {
			WaintingRoomWsController.broadcasToRoom(tournamentId, {
				type: 'player_quit',
				message: `${userId} quit the tournament!`,
				playerId: userId,
			})
		}

		// console.log('🔥 notify closed tournament (BY PLAYER)');
		await tournamentService.removePlayerFromTournament(request.server.prisma, tournamentId, userId);
		return reply.code(204).send();
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to delete tournament"});
	}
}

async function getParticipantInfoHandler (request: FastifyRequest<{ Params: { id: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const tournamentId = request.params.id;

		// console.log('=======',tournamentId)
		const participant = await tournamentService.findTournamentByParticipant(request.server.prisma, userId, tournamentId);
		if (!participant) {
			return reply.code(404).send({
				message: "Tournament not found or unauthorized"
			});
		}
		return participant;
	} catch (error: any) {
		// console.log(error);
		reply.code(500).send({ message: "Failed to get participant info"});
	}
}

async function quitTournamentHandler (request: FastifyRequest<{ Params: { id: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const tournamentId = request.params.id;

		const tournamentPlayer = await tournamentService.findTournamentByParticipant(request.server.prisma, userId, tournamentId);
		if (!tournamentPlayer) {
			return reply.code(404).send({
				message: "Tournament or Player not found or unauthorized"
			});
		}
		if (tournamentPlayer.tournament.status !== 'IN_PROGRESS') {
			return reply.code(400).send({
				message: "Can not quit a tournament that is not in progress"
			});
		}
		if (tournamentPlayer.isQuit) {
			return reply.code(400).send({
				message: "Can not quit a tournament player has already quit"
			});
		} 
		if (!tournamentPlayer.isEliminated){
			const game = await tournamentService.findCurrentGameByUserTournamentId(request.server.prisma, userId, tournamentId);
			if (!game) return;
			const winner = game?.gameUsers.find((u: any) => u.userId !== userId);
			await gameService.finishGame(request.server.prisma, game.id, {
				status: 'ABANDONED',
				winnerId: winner ? winner.userId : null,
				gamePlayers: game.gameUsers
			});
		} 
		
		await tournamentService.quitTournamentByParticipantId(request.server.prisma, tournamentPlayer.id);
		return reply.code(200).send({ message: "User quit tournament" });
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to quit tournament"});
	}
}

async function startTournamentHandler (request: FastifyRequest<{ Params: { id: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const tournamentId = request.params.id;
		const tournament = await tournamentService.findTournamentByUserId(request.server.prisma, userId, tournamentId)
		if (!tournament) {
			return reply.code(404).send({
				message: "Tournament not found or unauthorized"
			});
		}
		if (tournament.status !== "REGISTRATION") {
			return reply.code(409).send({
				message: "Cannot start tournament, tournament has already started or finished"
			});
		}
		if (tournament.participants.length < tournament.numberPlayers) {
			return reply.code(409).send({
				message: "Tournament is not yet full"
			});
		}
		let response = await tournamentService.startTournament(request.server.prisma, tournamentId);
		
		await tournamentService.matchMakeGames(request.server.prisma, userId, tournament);
		await tournamentService.createEmptyGames(request.server.prisma, userId, tournament);

		WaintingRoomWsController.broadcasToRoom(tournament.id, {
			type: 'start_tournament',
			message:'Tournament has started',
		})
		
		TournamentWsController.broadcastToRoom(tournament.id, {
			type: 'start_tournament',
			message:'Tournament has started',
		})

		return response;
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to start tournament"});
	}
}

async function getTournamentGamesHandler (request: FastifyRequest<{ Params: { id: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const tournamentId = request.params.id;
		const tournament = await tournamentService.findTournamentByParticipant(request.server.prisma, userId, tournamentId)
		if (!tournament) {
			return reply.code(404).send({
				message: "Tournament not found or unauthorized"
			});
		}
		const games = await tournamentService.findTournamentGames(request.server.prisma, tournamentId);
		return games;
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to get tournament games"});
	}
}

async function startTournamentGameHandler (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const gameId = request.params.id;
		const game = await gameService.findGameById(request.server.prisma, gameId);
		if (!game || game.status !== 'PENDING' || game.type !== 'TOURNAMENT' || !game.gameUsers.some((user: typeof game.gameUsers[0]) => user.user.id === userId)) {
			return reply.code(404).send({
				message: "Game not found or unauthorized"
			});
		}
		const player = game.gameUsers.find((u: typeof game.gameUsers[0]) => u.user.id === userId);
		const opponent = game.gameUsers.find((u: typeof game.gameUsers[0]) => u.user.id !== userId);
		if (!opponent || !player) {
			return reply.code(404).send({
				message: "Game is not yet completed"
			});
		}

		if (!player.isReady) {
			await tournamentService.markPlayerReadyByGamePlayerId(request.server.prisma, player.id);
		}

		const updatedGame = await gameService.findGameById(request.server.prisma, gameId);
		const updatedOpponent = updatedGame?.gameUsers.find((u: typeof updatedGame.gameUsers[0]) => u.user.id !== userId);

		if (!game.tournamentId || !updatedOpponent) {
		    return reply.code(500).send({ message: "Invalid game state" });
		}

		if (updatedOpponent?.isReady) {
			await gameService.startGame(request.server.prisma, gameId, userId);
			TournamentWsController.notifyGameReadiness(game.tournamentId, {user: userId, opponent: updatedOpponent.user.id}, 'start_game', updatedGame);

		} else {
			TournamentWsController.notifyGameReadiness(game.tournamentId, {user: userId, opponent: updatedOpponent.user.id}, 'opponent_ready', updatedGame);
		}

		return updatedGame;
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to start tournament game"});
	}
}

async function advanceTournamentHandler (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const tournamentId = request.params.id;

		// get all the tournament games
		const games = await tournamentService.findTournamentGames(request.server.prisma, tournamentId);
		if (!games) return ;
		// filter games that have COMPLETED/ABANDONED status
		const finishedGames = games.filter((game: typeof games[0]) => game.status === 'ABANDONED' || game.status === 'COMPLETED');

		// find if the correspondant game of the bracket is also finished
		for (const game of finishedGames) {
			if (game.matchNumber === null || game.roundNumber === null) continue;

			const pairMatchNumber = game.matchNumber % 2 === 0 ? game.matchNumber - 1 : game.matchNumber + 1;
			const pairGame = finishedGames.find((nextGame: typeof finishedGames[0]) => 
				nextGame.roundNumber === game.roundNumber && nextGame.matchNumber === pairMatchNumber);
			if (!pairGame) return;

			const nextRound = game.roundNumber + 1;
			const nextMatch = Math.ceil(game.matchNumber / 2);

			const existingNextGame = await tournamentService.findGameByRoundNMatch(request.server.prisma, tournamentId, nextRound, nextMatch);
			if (existingNextGame) continue;

			const winner1 = game.gameUsers.find((winner: typeof game.gameUsers[0]) => winner.isWinner);
			const winner2 = pairGame.gameUsers.find((winner: typeof game.gameUsers[0]) => winner.isWinner);

			if (!winner1 || !winner2) return;

			await request.server.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
				const newGame = await tx.game.create({ data: {
					createdBy: userId, 
					type: 'TOURNAMENT',
					scoreToWin: pairGame.scoreToWin,
					tournamentId,
					roundNumber: nextRound,
					matchNumber: nextMatch,
				}})
				
				await tx.gamePlayer.createMany({
					data: [
						{ gameId: newGame.id, userId: winner1.user.id },
						{ gameId: newGame.id, userId: winner2.user.id }
					]
				})
			});
		}
		reply.code(200).send({ message: "Tournament advanced successfully"});
	} catch (error: any) {
		// console.log(error);
		reply.code(500).send({ message: "Failed to advance tournament"});
	}
}

async function resetTournamentHandler(request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
	try {	
		const tournamentId = request.params.id;
		const prisma = request.server.prisma;
		const gamePlayers = await tournamentService.findAllGamePlayersByTournamentId(prisma, tournamentId);
		if (gamePlayers) {
			for (const game of gamePlayers) {
				if (game.roundNumber != 1) {
					for (const player of game.gameUsers)
						await tournamentService.deleteGamePlayer(prisma, player.id);
				} else {
					for (const player of game.gameUsers)
						await tournamentService.resetGamePlayer(prisma, player.id);
				}
				for (const participants of game.tournament!.participants)
					await tournamentService.resetTournamentPlayer(prisma, participants.id);
				await tournamentService.resetGame(prisma, game.id);
			}
			if (gamePlayers[0]?.tournament?.status != 'IN_PROGRESS')
				await tournamentService.resetTournament(prisma, tournamentId);
		}
		reply.code(200).send({ message: "Tournament reset successfully"});
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to reset the tournament "});		
	}
}

async function claimVictoryHandler(request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
    try {
        const userId = request.user!.id;
        const gameId = request.params.id;
        const prisma = request.server.prisma;

        const game = await gameService.findGameById(prisma, gameId);

        if (!game || game.status !== 'PENDING' || game.type !== 'TOURNAMENT') {
            return reply.code(404).send({ message: "Game not found or already processed" });
        }

        const player = game.gameUsers.find(u => u.user.id === userId);
        const opponent = game.gameUsers.find(u => u.user.id !== userId);

        if (!player || !opponent) {
            return reply.code(404).send({ message: "Participants not found" });
        }

        if (opponent.isReady) {
            return reply.code(400).send({ message: "Opponent is ready. Play the match!" });
        }

        if (!player.readyAt) {
            return reply.code(400).send({ message: "You haven't readied up yet." });
        }

        const elapsed = Date.now() - new Date(player.readyAt).getTime();
        const ONE_MINUTE = 60000;

        if (elapsed < ONE_MINUTE) {
            const remaining = Math.ceil((ONE_MINUTE - elapsed) / 1000);
            return reply.code(400).send({ message: `Wait another ${remaining}s` });
        }

        await gameService.finishGame(prisma, gameId, {
            status: 'ABANDONED',
            winnerId: userId,
            gamePlayers: game.gameUsers
        });

        return reply.code(200).send({ message: "Victory claimed successfully" });
    } catch (error: any) {
        return reply.code(500).send({ message: "Failed to claim victory" });
    }
}

// =====================
// Tournament Helpers
// =====================

function generateTournamentToken() {
	const randomBytes = crypto.randomBytes(8);
	const token = randomBytes.toString('base64url');
	return token.slice(0, 8);
}

// =====================
// Export Controller Object
// =====================

export const tournamentController = {
	// Tournament CRUD
	createTournamentHandler,
	getTournamentHandler,
	getCurrentTournamentHandler,
	generateTokenHandler,
	joinTournamentHandler,
	removePlayerHandler,
	deletePendingTournamentHandler,
	startTournamentHandler,
	getTournamentGamesHandler,
	startTournamentGameHandler,
	advanceTournamentHandler,
	quitTournamentHandler,
	getParticipantInfoHandler,
	resetTournamentHandler,
	claimVictoryHandler
};
