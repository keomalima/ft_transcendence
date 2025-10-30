import Fastify from 'fastify'
import cors from '@fastify/cors';

const fastify = Fastify({
  logger: true
})

await fastify.register(cors, { 
  origin: true // or specify allowed origins
});

// Declare a route
fastify.get('/', async function handler (request, reply) {
  return { helloo: 'world' }
})

// Run the server!
try {
  await fastify.listen({ port: 3000, host: '0.0.0.0' })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}