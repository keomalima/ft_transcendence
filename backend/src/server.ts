// Import the framework and instantiate it
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

const fastify: FastifyInstance= Fastify({
  logger: true
})

// Declare a route
fastify.get('/', async function handler (request : FastifyRequest, reply : FastifyReply) {
  return { hello: 'world' }
})


try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
} catch (err) {
    fastify.log.error(err);
    process.exit(1);
}
