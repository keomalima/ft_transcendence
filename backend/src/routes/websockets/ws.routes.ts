import type { FastifyInstance } from "fastify";
import { userController } from "../user/user.controller.js";
import { z } from "zod";
import { WaintingRoomWsController } from "./gameroom/waitingroom.ws.controller.js";
import { GameWsController } from "./game/game.ws.controller.js";
import { ClientRequest, get, Server } from "http";
import { Http2ServerRequest } from "http2";
import { ChatWsController } from "./chat/chat.ws.controller.js";
import { TournamentWsController } from "./tournament/tournament.ws.controller.js";
import { DashboardWsController } from "./profile/profile.ws.controller.js";

// =====================
// Private Routes (Authentication Required)
// =====================

export async function wsPrivateRoutes(fastify: FastifyInstance) {

	// dashboard profile websocket
	fastify.get('/dashboard/:userId', {websocket: true}, DashboardWsController.dashboardHandler);
	
	// waiting game room websocket
	fastify.get('/waiting-room/:gameId/:userId', { websocket: true }, WaintingRoomWsController.waitingRoomHandler);

	// game websocket
	fastify.get('/game/:gameId/:userId/:scoreToWin', { websocket: true }, GameWsController.gameHandler);

	// chat websocket
	fastify.get('/chat/:userId', { websocket: true }, ChatWsController.chatHandler);

	// tournament websocket
	fastify.get('/tournament/:tournamentId/:userId', {websocket: true}, TournamentWsController.tournamentBracketHandler)
}