import { PurolatorConfig } from '../types/shipment-tracking.types';
import { join } from 'node:path';

/**
 * Purolator API Configuration
 * 
 * Environment Variables:
 * - PUROLATOR_ACTIVATION_KEY: Your Purolator API activation key
 * - PUROLATOR_ACCOUNT_NUMBER: Your registered Purolator account number
 * - PUROLATOR_ENVIRONMENT: 'production' or 'development' (default: development)
 * - PUROLATOR_LANGUAGE: 'en' or 'fr' (default: en)
 * - PUROLATOR_GROUP_ID: Your group ID (optional)
 */

const isProd = process.env.PUROLATOR_ENVIRONMENT === 'production';

export const purolatorConfig: PurolatorConfig = {
  // WSDL file path (local)
  wsdlUrl: join(__dirname, '../../wsdl/ShipmentTrackingService.wsdl'),
  
  // Service endpoint
  endpoint: isProd
    ? 'https://webservices.purolator.com/EWS/v2/ShipmentTracking/ShipmentTrackingService.asmx'
    : 'https://devwebservices.purolator.com/EWS/v2/ShipmentTracking/ShipmentTrackingService.asmx',
  
  // API credentials
  activationKey: process.env.PUROLATOR_ACTIVATION_KEY || '',
  registeredAccountNumber: process.env.PUROLATOR_ACCOUNT_NUMBER || '',
  
  // Request defaults
  version: '2.0',
  language: (process.env.PUROLATOR_LANGUAGE as 'en' | 'fr') || 'en',
  groupId: process.env.PUROLATOR_GROUP_ID || 'e-tracking',
};

/**
 * Validate configuration
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!purolatorConfig.activationKey) {
    errors.push('PUROLATOR_ACTIVATION_KEY environment variable is required');
  }

  if (!purolatorConfig.registeredAccountNumber) {
    errors.push('PUROLATOR_ACCOUNT_NUMBER environment variable is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

