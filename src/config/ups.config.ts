/**
 * UPS API Configuration
 * 
 * Environment Variables:
 * - UPS_CLIENT_ID: Your UPS API Client ID
 * - UPS_CLIENT_SECRET: Your UPS API Client Secret
 * - UPS_ENVIRONMENT: 'production' or 'development' (default: development)
 * - UPS_ACCOUNT_NUMBER: Your UPS account number (optional)
 */

export interface UpsConfig {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  tokenUrl: string;
  accountNumber?: string;
}

const isProd = process.env.UPS_ENVIRONMENT === 'production';

export const upsConfig: UpsConfig = {
  // OAuth2 credentials
  clientId: process.env.UPS_CLIENT_ID || '',
  clientSecret: process.env.UPS_CLIENT_SECRET || '',
  
  // API endpoints
  baseUrl: isProd
    ? 'https://onlinetools.ups.com/api'
    : 'https://wwwcie.ups.com/api',
  
  tokenUrl: isProd
    ? 'https://onlinetools.ups.com/security/v1/oauth/token'
    : 'https://wwwcie.ups.com/security/v1/oauth/token',
  
  // Optional account number
  accountNumber: process.env.UPS_ACCOUNT_NUMBER,
};

/**
 * Validate UPS configuration
 */
export function validateUpsConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!upsConfig.clientId) {
    errors.push('UPS_CLIENT_ID environment variable is required');
  }

  if (!upsConfig.clientSecret) {
    errors.push('UPS_CLIENT_SECRET environment variable is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

