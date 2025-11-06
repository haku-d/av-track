import { FastifyInstance } from 'fastify';
import { getTrackingService, isCarrierSupported, getSupportedCarriers, CarrierType } from '../../services/carriers/tracking-service-factory';
import { trackingDatabaseService } from '../../services/tracking-database.service';
import { createValidationErrorResponse, createInternalErrorResponse } from '../../utils/error-response';

/**
 * Register generic multi-carrier tracking routes
 * Pattern: /tracking/:service/:trackingNumber
 * Supports: purolator, ups, fedex, dhl, stampede
 */
export function registerGenericTrackingRoutes(fastify: FastifyInstance) {
  // ========================================================================
  // GENERIC MULTI-CARRIER TRACKING ENDPOINTS
  // ========================================================================

  // GET /tracking/:service/:trackingNumber - Quick track shipment (no storage)
  fastify.get<{
    Params: { service: string; trackingNumber: string };
    Querystring: {
      shipmentDateFrom?: string;
      shipmentDateTo?: string;
      pod?: string;
      shipmentView?: string;
    };
  }>('/:service/:trackingNumber', async (request, reply) => {
    const { service, trackingNumber } = request.params;
    const { shipmentDateFrom, shipmentDateTo, pod, shipmentView } = request.query;

    try {
      // Validate service
      if (!isCarrierSupported(service)) {
        return reply.code(400).send(
          createValidationErrorResponse(
            `Carrier "${service}" is not supported. Supported carriers: ${getSupportedCarriers().join(', ')}`
          )
        );
      }

      // Validate tracking number
      if (!trackingNumber || trackingNumber.trim().length === 0) {
        return reply.code(400).send(
          createValidationErrorResponse('Tracking number is required')
        );
      }

      // Get tracking service for the carrier
      const trackingService = getTrackingService(service);
      await trackingService.initialize();

      // Build tracking options
      const options: any = { trackingIds: [trackingNumber] };
      if (shipmentDateFrom) options.shipmentDateFrom = shipmentDateFrom;
      if (shipmentDateTo) options.shipmentDateTo = shipmentDateTo;
      if (pod !== undefined) options.pod = pod === 'true';
      if (shipmentView !== undefined) options.shipmentView = shipmentView === 'true';

      // Track the shipment
      const result = await trackingService.trackStandardized(options);

      if (result.status === 'error' || result.status === 'ERROR') {
        return reply.code(400).send(result);
      }

      return result;
    } catch (error) {
      return reply.code(500).send(createInternalErrorResponse(error));
    }
  });

  // POST /tracking/:service/:trackingNumber - Track and store shipment for continuous monitoring
  fastify.post<{
    Params: { service: string; trackingNumber: string };
    Querystring: {
      shipmentDateFrom?: string;
      shipmentDateTo?: string;
      pod?: string;
      shipmentView?: string;
    };
  }>('/:service/:trackingNumber', async (request, reply) => {
    const { service, trackingNumber } = request.params;
    const { shipmentDateFrom, shipmentDateTo, pod, shipmentView } = request.query;

    try {
      // Validate service
      if (!isCarrierSupported(service)) {
        return reply.code(400).send(
          createValidationErrorResponse(
            `Carrier "${service}" is not supported. Supported carriers: ${getSupportedCarriers().join(', ')}`
          )
        );
      }

      // Validate tracking number
      if (!trackingNumber || trackingNumber.trim().length === 0) {
        return reply.code(400).send(
          createValidationErrorResponse('Tracking number is required')
        );
      }

      // Get tracking service for the carrier
      const trackingService = getTrackingService(service);
      await trackingService.initialize();

      // Build tracking options
      const options: any = { trackingIds: [trackingNumber] };
      if (shipmentDateFrom) options.shipmentDateFrom = shipmentDateFrom;
      if (shipmentDateTo) options.shipmentDateTo = shipmentDateTo;
      if (pod !== undefined) options.pod = pod === 'true';
      if (shipmentView !== undefined) options.shipmentView = shipmentView === 'true';

      // Track the shipment
      const trackingResult = await trackingService.trackStandardized(options);

      // Check if tracking was successful
      if (trackingResult.status === 'error' || trackingResult.status === 'ERROR') {
        return reply.code(400).send({
          success: false,
          message: 'Failed to track shipment',
          trackingResult,
        });
      }

      // Save to database for continuous monitoring
      const savedShipment = await trackingDatabaseService.saveTrackedShipment(
        trackingNumber,
        service as CarrierType,
        trackingResult
      );

      return reply.code(201).send({
        success: true,
        message: `${service.toUpperCase()} shipment is now being tracked`,
        data: {
          trackingNo: savedShipment.trackingNo,
          service: savedShipment.service,
          isActive: savedShipment.isActive,
          lastUpdated: savedShipment.lastUpdated,
          createdAt: savedShipment.createdAt,
          trackingResponse: savedShipment.trackingResponse,
        },
      });
    } catch (error) {
      return reply.code(500).send(createInternalErrorResponse(error));
    }
  });

  // GET /tracking/:service/:trackingNumber/status - Get stored tracking status
  fastify.get<{
    Params: { service: string; trackingNumber: string };
  }>('/:service/:trackingNumber/status', async (request, reply) => {
    const { service, trackingNumber } = request.params;

    try {
      // Validate service
      if (!isCarrierSupported(service)) {
        return reply.code(400).send(
          createValidationErrorResponse(
            `Carrier "${service}" is not supported. Supported carriers: ${getSupportedCarriers().join(', ')}`
          )
        );
      }

      const trackedShipment = await trackingDatabaseService.getTrackedShipment(
        trackingNumber,
        service as CarrierType
      );

      if (!trackedShipment) {
        return reply.code(404).send({
          success: false,
          message: `${service.toUpperCase()} shipment not found in tracking database`,
        });
      }

      return {
        success: true,
        data: {
          trackingNo: trackedShipment.trackingNo,
          service: trackedShipment.service,
          isActive: trackedShipment.isActive,
          lastUpdated: trackedShipment.lastUpdated,
          createdAt: trackedShipment.createdAt,
          errorCount: trackedShipment.errorCount,
          lastError: trackedShipment.lastError,
          trackingResponse: trackedShipment.trackingResponse,
        },
      };
    } catch (error) {
      return reply.code(500).send(createInternalErrorResponse(error));
    }
  });

  // DELETE /tracking/:service/:trackingNumber - Stop tracking a shipment
  fastify.delete<{
    Params: { service: string; trackingNumber: string };
  }>('/:service/:trackingNumber', async (request, reply) => {
    const { service, trackingNumber } = request.params;

    try {
      // Validate service
      if (!isCarrierSupported(service)) {
        return reply.code(400).send(
          createValidationErrorResponse(
            `Carrier "${service}" is not supported. Supported carriers: ${getSupportedCarriers().join(', ')}`
          )
        );
      }

      const deleted = await trackingDatabaseService.deleteTrackedShipment(
        trackingNumber,
        service as CarrierType
      );

      if (!deleted) {
        return reply.code(404).send({
          success: false,
          message: `${service.toUpperCase()} shipment not found in tracking database`,
        });
      }

      return {
        success: true,
        message: `${service.toUpperCase()} shipment tracking stopped`,
      };
    } catch (error) {
      return reply.code(500).send(createInternalErrorResponse(error));
    }
  });
}

