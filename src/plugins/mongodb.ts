import fp from 'fastify-plugin';
import mongoose from 'mongoose';
import mongodbConfig, { validateMongoDBConfig } from '../config/mongodb.config';

export interface MongoDBPluginOptions {
  // Specify MongoDB plugin options here
}

/**
 * MongoDB plugin for Fastify
 * Connects to MongoDB using Mongoose and decorates the Fastify instance
 */
export default fp<MongoDBPluginOptions>(async (fastify, opts) => {
  try {
    // Validate configuration
    const validation = validateMongoDBConfig();
    if (!validation.valid) {
      fastify.log.error({ errors: validation.errors }, 'MongoDB configuration validation failed');
      throw new Error(`MongoDB configuration invalid: ${validation.errors.join(', ')}`);
    }

    // Connect to MongoDB
    fastify.log.info(`Connecting to MongoDB at ${mongodbConfig.uri}/${mongodbConfig.dbName}...`);
    
    await mongoose.connect(mongodbConfig.uri, {
      dbName: mongodbConfig.dbName,
      ...mongodbConfig.options,
    });

    fastify.log.info('MongoDB connected successfully');

    // Decorate Fastify instance with mongoose
    fastify.decorate('mongoose', mongoose);

    // Handle graceful shutdown
    fastify.addHook('onClose', async (instance) => {
      instance.log.info('Closing MongoDB connection...');
      await mongoose.connection.close();
      instance.log.info('MongoDB connection closed');
    });

    // Handle connection errors
    mongoose.connection.on('error', (err) => {
      fastify.log.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      fastify.log.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      fastify.log.info('MongoDB reconnected');
    });

  } catch (error) {
    fastify.log.error({ error }, 'Failed to connect to MongoDB');
    throw error;
  }
});

// TypeScript module augmentation for Fastify
declare module 'fastify' {
  export interface FastifyInstance {
    mongoose: typeof mongoose;
  }
}

