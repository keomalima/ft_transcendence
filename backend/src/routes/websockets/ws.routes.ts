import type { FastifyInstance } from "fastify";
import { userController } from "../user/user.controller.js";
import { z } from "zod";
import { wsController } from "./ws.controller.js";

// =====================
// Private Routes (Authentication Required)
// =====================

export async function wsPrivateRoutes(fastify: FastifyInstance) {
	fastify.get('/waiting-room/:gameId', { websocket: true }, wsController.waitingRoomHandler);
}