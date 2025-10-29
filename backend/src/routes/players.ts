import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';

const routes = async (
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) => {
    fastify.get('/players', async (
        request: FastifyRequest,
        reply: FastifyReply
    ) => {
        return { hello: 'world' };
    });
};

export default routes;
