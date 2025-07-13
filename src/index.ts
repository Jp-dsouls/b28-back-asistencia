import Hapi from '@hapi/hapi';
import Joi from 'joi';
import Inert from '@hapi/inert';
import Vision from '@hapi/vision';
// @ts-ignore
import HapiSwagger from 'hapi-swagger';

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
  });

  const swaggerOptions = {
    info: {
      title: 'API Documentación B28 Asistencia',
      version: '1.0.0',
    },
  };

  await server.register([
    Inert as any,
    Vision as any,
    {
      plugin: HapiSwagger as any,
      options: swaggerOptions,
    },
  ]);

  server.route({
    method: 'GET',
    path: '/saludo',
    options: {
      description: 'Ruta de prueba',
      notes: 'Retorna un saludo',
      tags: ['api'],
      validate: {
        query: Joi.object({
          nombre: Joi.string().min(2).max(30).required().description('Nombre de la persona'),
        }),
      },
    },
    handler: (request, h) => {
      const { nombre } = request.query as { nombre: string };
      return { mensaje: `Hola, ${nombre}!` };
    },
  });

  await server.start();
  console.log('Servidor corriendo en %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init(); 