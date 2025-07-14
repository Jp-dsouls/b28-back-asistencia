import Hapi from '@hapi/hapi';
import Joi from 'joi';
import Inert from '@hapi/inert';
import Vision from '@hapi/vision';
// @ts-ignore
import HapiSwagger from 'hapi-swagger';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Configurar variables de entorno
dotenv.config();

// Verificar que DATABASE_URL esté configurado
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL no está configurado en el archivo .env');
  process.exit(1);
}

// Configurar conexión a la base de datos
const sql = neon(process.env.DATABASE_URL);

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

  // Ruta para verificar configuración del entorno
  server.route({
    method: 'GET',
    path: '/config',
    options: {
      description: 'Verificar configuración del entorno',
      notes: 'Muestra si las variables de entorno están configuradas',
      tags: ['api'],
    },
    handler: async (request, h) => {
      const hasDatabaseUrl = !!process.env.DATABASE_URL;
      const databaseUrlLength = process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0;
      
      return { 
        configuracion: {
          databaseUrlConfigurado: hasDatabaseUrl,
          databaseUrlLength: databaseUrlLength,
          nodeEnv: process.env.NODE_ENV || 'development'
        }
      };
    },
  });

  // Ruta de prueba para verificar la conexión a la base de datos
  server.route({
    method: 'GET',
    path: '/db-test',
    options: {
      description: 'Prueba de conexión a la base de datos',
      notes: 'Retorna la versión de PostgreSQL',
      tags: ['api'],
    },
    handler: async (request, h) => {
      try {
        console.log('Intentando conectar a la base de datos...');
        console.log('DATABASE_URL configurado:', process.env.DATABASE_URL ? 'Sí' : 'No');
        
        const result = await sql`SELECT version()`;
        const { version } = result[0];
        console.log('Conexión exitosa:', version);
        return { mensaje: 'Conexión exitosa', version };
      } catch (error: any) {
        console.error('Error de conexión:', error);
        return h.response({ 
          error: 'Error de conexión a la base de datos', 
          details: {
            message: error.message,
            name: error.name,
            code: error.code
          }
        }).code(500);
      }
    },
  });

  // Ruta para probar conexión simple
  server.route({
    method: 'GET',
    path: '/db-simple',
    options: {
      description: 'Prueba de conexión simple',
      notes: 'Prueba una consulta simple',
      tags: ['api'],
    },
    handler: async (request, h) => {
      try {
        console.log('Probando conexión simple...');
        
        // Prueba una consulta muy simple
        const result = await sql`SELECT 1 as test`;
        console.log('Consulta simple exitosa:', result);
        
        return { 
          mensaje: 'Conexión simple exitosa', 
          resultado: result[0]
        };
      } catch (error: any) {
        console.error('Error en conexión simple:', error);
        return h.response({ 
          error: 'Error en conexión simple', 
          details: {
            message: error.message,
            name: error.name,
            code: error.code,
            stack: error.stack
          }
        }).code(500);
      }
    },
  });

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