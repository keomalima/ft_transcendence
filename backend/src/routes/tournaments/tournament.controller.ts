import type { FastifyReply, FastifyRequest } from 'fastify'
import { tournamentService } from './tournament.service.js';
import type { CreateTournamentInput } from './tournament.schema.js';

// =====================
// Game CRUD Handlers
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

async function getTournamentHandler (request: FastifyRequest<{Params: { id: string }}>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const tournamentId = request.params.id;
		const tournament = await tournamentService.findTournamentById(request.server.prisma, tournamentId);
		if (!tournament) {
			return reply.code(404).send({
            	message: "Game not found or unauthorized"
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

// =====================
// Export Controller Object
// =====================

export const tournamentController = {
	// Tournament CRUD
	createTournamentHandler,
	getTournamentHandler
};