import type { FastifyInstance } from "fastify";
import { userController } from "../user/user.controller.js";
import { z } from "zod";
import { WaintingRoomWsController } from "./waitingroom.ws.controller.js";
import { GameWsController } from "./game/game.ws.controller.js";
import { ClientRequest, get, Server } from "http";
import { Http2ServerRequest } from "http2";

// =====================
// Private Routes (Authentication Required)
// =====================

export async function wsPrivateRoutes(fastify: FastifyInstance) {

	// waiting game room websocket
	fastify.get('/waiting-room/:gameId/:userId', { websocket: true }, WaintingRoomWsController.waitingRoomHandler);

	// game websocket
	fastify.get('/game/:gameId/:userId', { websocket: true }, GameWsController.gameHandler);

}