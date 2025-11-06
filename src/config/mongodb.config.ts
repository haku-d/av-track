/**
 * MongoDB Configuration
 * 
 * Environment Variables:
 * - MONGODB_URI: MongoDB connection string
 * - MONGODB_DB_NAME: Database name (default: e-tracking)
 */

export interface MongoDBConfig {
  uri: string;
  dbName: string;
  options: {
    maxPoolSize?: number;
    minPoolSize?: number;
    serverSelectionTimeoutMS?: number;
    socketTimeoutMS?: number;
  };
}

const mongodbConfig: MongoDBConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  dbName: process.env.MONGODB_DB_NAME || 'e-tracking',
  options: {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
};

/**
 * Validate MongoDB configuration
 */
export function validateMongoDBConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!mongodbConfig.uri) {
    errors.push('MONGODB_URI environment variable is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default mongodbConfig;

