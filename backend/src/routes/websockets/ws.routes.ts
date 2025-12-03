import type { FastifyInstance } from "fastify";
import { userController } from "../user/user.controller.js";
import { z } from "zod";
import { wsController } from "./ws.controller.js";
import { ClientRequest, get, Server } from "http";
import { Http2ServerRequest } from "http2";

// =====================
// Private Routes (Authentication Required)
// =====================

export async function wsPrivateRoutes(fastify: FastifyInstance) {
	fastify.get('/waiting-room/:gameId/:userId', { websocket: true }, wsController.waitingRoomHandler);
}