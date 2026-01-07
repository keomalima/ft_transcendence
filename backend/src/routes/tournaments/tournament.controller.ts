import type { FastifyReply, FastifyRequest } from 'fastify'
import { Prisma } from '@prisma/client'
import { tournamentService } from './tournament.service.js';
import type { CreateTournamentInput } from './tournament.schema.js';
import crypto from 'crypto';
import { WaintingRoomWsController } from '../websockets/gameroom/waitingroom.ws.controller.js';
import { gameService } from '../game/game.service.js';

// =====================
// Tournament CRUD Handlers
// =====================

async function createTournamentHandler (request: FastifyRequest<{ Body: CreateTournamentInput }>, reply: FastifyReply) {
	try {
		const body = request.body;
		const userId = request.user!.id;

		if (body.numberPlayers < 2 || body.numberPlayers % 2 !== 0) {
			return reply.code(400).send({
				message: "Invalid number of players"
			});
		}

		const totalRounds = Math.ceil(Math.log2(body.numberPlayers));

		const isTournamentOn = await tournamentService.findActiveTournamentByUserId(request.server.prisma, request.user!.id);
		if (isTournamentOn) {
			return reply.code(400).send({
				message: "User currently has an active tournament on"
			});
		}
		const newGame = await tournamentService.createTournament(request.server.prisma, body, userId, totalRounds);
		return reply.code(201).send(newGame);
	} catch (error: any) {
		console.log(error);
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
			token: tournament.createdBy === userId ? tournament.token : null
		}
		return response;
	} catch (error:any) {
		console.log(error);
		reply.code(500).send({ message: "Failed to get tournament"});
	}
}

async function joinTournamentHandler (request: FastifyRequest<{ Params: { token: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const joinedUser = request.user!;
		const token = request.params.token;
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

		WaintingRoomWsController.broadcasToRoom(tournament.id, {
			type: 'room_update',
			message: `${joinedUser.displayName} joined the tournament!`,
			userId,
			displayName: joinedUser.displayName,
			avatarUrl: joinedUser.avatarUrl
		})
		return  await tournamentService.joinUserToTournament(request.server.prisma, tournament.id, userId);
	} catch (error: any) {
		console.error(error);
		reply.code(500).send({ message: "Failed to join tournament"});
	}
}

async function getCurrentTournamentHandler(request: FastifyRequest, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const tournament = await tournamentService.findActiveTournamentByUserId(request.server.prisma, userId);
		if (!tournament) 
			return reply.code(204).send();

		return {
			userId: tournament.userId,
			tournamentId: tournament.tournamentId,
			status: tournament.tournament.status,
			token: tournament.tournament.token,
			totalRounds: tournament.tournament.totalRounds,
			currentRound: tournament.tournament.currentRound
		}
	} catch (error:any) {
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

		WaintingRoomWsController.notifyPlayerRemoved(tournamentId, playerId);

		reply.code(204).send(await tournamentService.removePlayerFromTournament(request.server.prisma, tournamentId, playerId));
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
			console.log('🔥 notify closed tournament (BY CREATOR)');
			WaintingRoomWsController.notifyGameClosed(tournamentId, userId);
			return reply.code(204).send(await tournamentService.deletePendingTournament(request.server.prisma, tournamentId));
		}

		console.log('🔥 notify closed tournament (BY PLAYER)');
		WaintingRoomWsController.broadcasToRoom(tournament.id, {
			type: 'room_update',
			message: `Need to update the tournament - QUIT!`,
		});
		return reply.code(204).send(await tournamentService.removePlayerFromTournament(request.server.prisma, tournamentId, userId));
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to delete tournament"});
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
			message: `Start tournament!`
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
		if (!game || game.status !== 'PENDING' || game.type !== 'TOURNAMENT' || !game.gameUsers.some((user: typeof game.GameUsers[0]) => user.user.id === userId)) {
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

		if (updatedOpponent?.isReady) {
			await gameService.startGame(request.server.prisma, gameId, userId);
			WaintingRoomWsController.broadcasToRoom(game.id, {
				type: 'start_game',
				message: `${player.user.displayName} is starting the game!`,
				game: updatedGame
			})
		} else {
			WaintingRoomWsController.broadcasToRoom(game.id, {
				type: 'room_update',
				message: `${player.user.displayName} is ready for the game!`,
				game: updatedGame
			})
		}

		return updatedGame;
	} catch (error: any) {
		console.log(error);
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
		console.log(error);
		reply.code(500).send({ message: "Failed to advance tournament"});
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
	advanceTournamentHandler
};
