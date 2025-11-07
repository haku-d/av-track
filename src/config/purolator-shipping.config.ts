import { PurolatorServiceConfig } from '../types/purolator-common.types';
import { join } from 'path';

/**
 * Purolator Shipping API Configuration
 * 
 * Environment Variables:
 * - PUROLATOR_ACTIVATION_KEY: Your Purolator API activation key
 * - PUROLATOR_ACCOUNT_NUMBER: Your registered Purolator account number
 * - PUROLATOR_ENVIRONMENT: 'production' or 'development' (default: development)
 * - PUROLATOR_LANGUAGE: 'en' or 'fr' (default: en)
 * - PUROLATOR_GROUP_ID: Your group ID (optional)
 * - PUROLATOR_SHIPPING_WSDL_URL: Path to shipping WSDL file (optional)
 */

const isProd = process.env.PUROLATOR_ENVIRONMENT === 'production';

export const purolatorShippingConfig: PurolatorServiceConfig = {
  // WSDL file path (local)
  wsdlUrl: process.env.PUROLATOR_SHIPPING_WSDL_URL || join(__dirname, '../../wsdl/ShippingService.wsdl'),
  
  // Service endpoint
  endpoint: isProd
    ? 'https://webservices.purolator.com/EWS/V2/Shipping/ShippingService.asmx'
    : 'https://devwebservices.purolator.com/EWS/V2/Shipping/ShippingService.asmx',
  
  // API credentials (reuse from existing tracking config)
  activationKey: process.env.PUROLATOR_ACTIVATION_KEY || '',
  registeredAccountNumber: process.env.PUROLATOR_ACCOUNT_NUMBER || '',
  
  // Request defaults
  version: '2.0',
  language: (process.env.PUROLATOR_LANGUAGE as 'en' | 'fr') || 'en',
  groupId: process.env.PUROLATOR_GROUP_ID || 'e-tracking',
};

/**
 * Validate shipping configuration
 */
export function validateShippingConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!purolatorShippingConfig.activationKey) {
    errors.push('PUROLATOR_ACTIVATION_KEY environment variable is required');
  }

  if (!purolatorShippingConfig.registeredAccountNumber) {
    errors.push('PUROLATOR_ACCOUNT_NUMBER environment variable is required');
  }

  // Check if WSDL file exists (basic validation)
  try {
    const fs = require('fs');
    if (!fs.existsSync(purolatorShippingConfig.wsdlUrl)) {
      errors.push(`WSDL file not found at: ${purolatorShippingConfig.wsdlUrl}`);
    }
  } catch (error) {
    errors.push(`Error checking WSDL file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get shipping service endpoint based on environment
 */
export function getShippingEndpoint(): string {
  return purolatorShippingConfig.endpoint;
}

/**
 * Check if running in production environment
 */
export function isProductionEnvironment(): boolean {
  return isProd;
}
