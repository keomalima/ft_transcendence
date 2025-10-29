// Import the framework and instantiate it
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import tournamentsRoute from './routes/tournaments.js'
import playersRoute from './routes/players.js'

const fastify: FastifyInstance= Fastify({
  logger: true
})

fastify.register(tournamentsRoute)
fastify.register(playersRoute)

fastify.listen({ port: 3000, host: '0.0.0.0' }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})
