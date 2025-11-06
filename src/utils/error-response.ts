/**
 * Utility functions for creating standardized error responses
 */

import {
  TrackingResponse,
  StandardizedShipment,
  StandardizedAddress
} from '../types/shipment-tracking.types';

/**
 * Create an empty address object
 */
function createEmptyAddress(): StandardizedAddress {
  return {
    city: '',
    proviceState: '',
    countryCode: '',
    postalZipCode: '',
  };
}

/**
 * Create an empty shipment object for error responses
 */
function createEmptyShipment(): StandardizedShipment {
  return {
    status: '',
    description: '',
    isDelivered: false,
    createdDate: new Date(),
    shipper: createEmptyAddress(),
    receiver: createEmptyAddress(),
    packages: [],
  };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  description: string,
  errors: string[]
): TrackingResponse {
  return {
    status: 'error',
    description,
    errors,
    shipment: createEmptyShipment(),
  };
}

/**
 * Create a validation error response
 */
export function createValidationErrorResponse(message: string): TrackingResponse {
  return createErrorResponse('Validation error', [message]);
}

/**
 * Create an internal server error response
 */
export function createInternalErrorResponse(error: unknown): TrackingResponse {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  return createErrorResponse('Internal server error', [errorMessage]);
}

