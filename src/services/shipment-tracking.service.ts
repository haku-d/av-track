/**
 * @deprecated This file is deprecated. Use carrier-specific services from src/services/carriers/ instead.
 * This wrapper is maintained for backward compatibility only.
 *
 * For new code, use:
 * - import { purolatorTrackingService } from './carriers/purolator-tracking.service';
 * - import { getTrackingService } from './carriers/tracking-service-factory';
 */

// Re-export Purolator service for backward compatibility
export { PurolatorTrackingService as ShipmentTrackingService } from './carriers/purolator-tracking.service';
export { purolatorTrackingService as shipmentTrackingService } from './carriers/purolator-tracking.service';

