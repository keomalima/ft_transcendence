import type { FastifyReply, FastifyRequest } from 'fastify'
import { tournamentService } from './tournament.service.js';
import type { CreateTournamentInput } from './tournament.schema.js';
import crypto from 'crypto';
import { WaintingRoomWsController } from '../websockets/waitingroom.ws.controller.js';
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
		console.log(tournament);
		if (!tournament) 
			return reply.code(204).send();

		return {
			userId: tournament.userId,
			tournamentId: tournament.tournamentId,
			status: tournament.tournament.status,
			token: tournament.tournament.token
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
		WaintingRoomWsController.broadcasToRoom(tournament.id, {
			type: 'start_game',
			message: `Start tournament!`
		})
		return response;
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to start tournament"});
	}
}

async function matchMakeTournamentHandler (request: FastifyRequest<{ Params: { id: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const tournamentId = request.params.id;
		const tournament = await tournamentService.findTournamentByUserId(request.server.prisma, userId, tournamentId)
		if (!tournament) {
			return reply.code(404).send({
				message: "Tournament not found or unauthorized"
			});
		}
		const arr: number[] = [];
		for (let i = 0; i < tournament.numberPlayers / 2; ++i) {
			const data = {
				createdBy: userId,
				type: "TOURNAMENT",
				scoreToWin: tournament.scoreToWin,
				tournamentId: tournament.id,
				roundNumber: 1,
				matchNumber: i + 1
			}
			const game = await tournamentService.createTournamentGame(request.server.prisma, data);
			for (let j = 0; j < 2;) {
				let nbr = Math.floor(Math.random() * tournament.numberPlayers);
				if (!arr.includes(nbr)) {
					await gameService.joinUserToGame(request.server.prisma, game.id, tournament.participants[nbr].userId);
					arr.push(nbr);
					j++;
				}
			}
		}
	} catch (error: any) {
		console.log(error);
		reply.code(500).send({ message: "Failed to match make tournament"});
	}

	// 	backend/src/routes/tournaments/tournament.controller.ts:246-275 never sends a reply on the happy path. Fastify expects you to either return a payload or call reply.send(). Right now the route handler resolves with undefined and the request times out even though the games were created successfully.
	// backend/src/routes/tournaments/tournament.controller.ts:246-275 does not verify the tournament status or whether games for round 1 already exist. Hitting POST /:id/match-make twice will happily create another full set of games with the same participants, leaving you with duplicate round-one fixtures. You probably need to ensure the tournament is in the correct state (e.g. READY) and abort if round-one games already exist.
	// backend/src/routes/tournaments/tournament.controller.ts:257-274 assumes tournament.numberPlayers === tournament.participants.length. If match-making is triggered while the bracket isn’t full (or if someone left after startTournamentHandler ran), tournament.participants[nbr] becomes undefined and joinUserToGame throws. Guarding on participants.length (or even better, using the participants collection you already fetched) would prevent the undefined access.
	// The random pairing loop in backend/src/routes/tournaments/tournament.controller.ts:257-274 repeatedly samples until it finds an unused slot. As the bracket fills this becomes increasingly inefficient and couples “number of attempts” to luck. Shuffling the participants array once (Fisher–Yates) and pairing sequentially would be simpler, faster, and easier to test.
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
	matchMakeTournamentHandler
};