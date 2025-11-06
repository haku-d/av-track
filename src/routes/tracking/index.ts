import { FastifyPluginAsync } from 'fastify';
// Note: shipmentTrackingService is now a re-export of purolatorTrackingService for backward compatibility
import { shipmentTrackingService } from '../../services/shipment-tracking.service';
import { trackingDatabaseService } from '../../services/tracking-database.service';
import { trackingCronService } from '../../services/tracking-cron.service';
import { reportService } from '../../services/report.service';
import { validateConfig } from '../../config/purolator.config';
import { TrackingRequest } from '../../types/shipment-tracking.types';
import { ReportRequest } from '../../types/report.types';
import { createValidationErrorResponse, createInternalErrorResponse } from '../../utils/error-response';
import { registerGenericTrackingRoutes } from './generic-routes';

/**
 * Tracking routes plugin
 * Supports multi-carrier tracking with generic routes pattern: /tracking/:service/:trackingNumber
 */
const trackingRoutes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // Register generic multi-carrier tracking routes
  // Supports: purolator, ups, fedex, dhl, stampede
  registerGenericTrackingRoutes(fastify);

  // Health check for tracking service
  fastify.get('/health', async (request, reply) => {
    const configValidation = validateConfig();

    if (!configValidation.valid) {
      return reply.code(503).send({
        status: 'unhealthy',
        errors: configValidation.errors,
      });
    }

    return {
      status: 'healthy',
      service: 'Multi-Carrier Shipment Tracking',
      version: '3.0',
    };
  });

  // Get service description
  fastify.get('/describe', async (request, reply) => {
    try {
      const description = await shipmentTrackingService.describe();
      return {
        success: true,
        description,
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Track single shipment by PIN
  fastify.get<{
    Params: { pin: string };
    Querystring: {
      shipmentDateFrom?: string;
      shipmentDateTo?: string;
      pod?: string;
      shipmentView?: string;
    };
  }>('/pin/:pin', async (request, reply) => {
    const { pin } = request.params;
    const { shipmentDateFrom, shipmentDateTo, pod, shipmentView } = request.query;

    try {
      const options: any = { trackingIds: [pin] };
      if (shipmentDateFrom) options.shipmentDateFrom = shipmentDateFrom;
      if (shipmentDateTo) options.shipmentDateTo = shipmentDateTo;
      if (pod !== undefined) options.pod = pod === 'true';
      if (shipmentView !== undefined) options.shipmentView = shipmentView === 'true';

      const result = await shipmentTrackingService.trackStandardized(options);

      if (result.status === 'error') {
        return reply.code(400).send(result);
      }

      return result;
    } catch (error) {
      return reply.code(500).send(createInternalErrorResponse(error));
    }
  });

  // Track multiple shipments
  fastify.post<{
    Body: TrackingRequest;
  }>('/track', {
    schema: {
      body: {
        type: 'object',
        required: ['trackingIds'],
        properties: {
          trackingIds: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 50,
          },
          shipmentDateFrom: { type: 'string' },
          shipmentDateTo: { type: 'string' },
          pod: { type: 'boolean' },
          shipmentView: { type: 'boolean' },
          account: { type: 'string' },
          destinationPostalZipCode: { type: 'string' },
          eventSortOrder: { type: 'string', enum: ['ASC', 'DESC'] },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const result = await shipmentTrackingService.trackStandardized(request.body);

      if (result.status === 'error') {
        return reply.code(400).send(result);
      }

      return result;
    } catch (error) {
      return reply.code(500).send(createInternalErrorResponse(error));
    }
  });

  // Track by reference number
  fastify.get<{
    Params: { reference: string };
    Querystring: {
      shipmentDateFrom?: string;
      shipmentDateTo?: string;
      account?: string;
      destinationPostalZipCode?: string;
    };
  }>('/reference/:reference', async (request, reply) => {
    const { reference } = request.params;
    const { shipmentDateFrom, shipmentDateTo, account, destinationPostalZipCode } = request.query;

    try {
      const result = await shipmentTrackingService.trackStandardized({
        trackingIds: [reference],
        shipmentDateFrom,
        shipmentDateTo,
        account,
        destinationPostalZipCode,
      });

      if (result.status === 'error') {
        return reply.code(400).send(result);
      }

      return result;
    } catch (error) {
      return reply.code(500).send(createInternalErrorResponse(error));
    }
  });

  // Batch track by PINs (GET with comma-separated PINs)
  fastify.get<{
    Querystring: {
      pins: string;
      shipmentDateFrom?: string;
      shipmentDateTo?: string;
      pod?: string;
      shipmentView?: string;
    };
  }>('/pins', async (request, reply) => {
    const { pins, shipmentDateFrom, shipmentDateTo, pod, shipmentView } = request.query;

    if (!pins) {
      return reply.code(400).send(
        createValidationErrorResponse('pins query parameter is required - Provide comma-separated PIN numbers')
      );
    }

    const pinArray = pins.split(',').map((p) => p.trim()).filter((p) => p);

    if (pinArray.length === 0) {
      return reply.code(400).send(
        createValidationErrorResponse('At least one PIN is required')
      );
    }

    if (pinArray.length > 50) {
      return reply.code(400).send(
        createValidationErrorResponse('Maximum 50 PINs allowed per request')
      );
    }

    try {
      const result = await shipmentTrackingService.trackStandardized({
        trackingIds: pinArray,
        shipmentDateFrom,
        shipmentDateTo,
        pod: pod === 'true',
        shipmentView: shipmentView === 'true',
      });

      if (result.status === 'error') {
        return reply.code(400).send(result);
      }

      return result;
    } catch (error) {
      return reply.code(500).send(createInternalErrorResponse(error));
    }
  });

  // ========================================================================
  // GENERAL TRACKING ENDPOINTS
  // ========================================================================
  // Note: Carrier-specific routes (/:service/:trackingNumber) are now handled
  // by the generic routes registered above via registerGenericTrackingRoutes()
  // ========================================================================

  // GET /tracking/stats - Get tracking statistics
  fastify.get('/stats', async (request, reply) => {
    try {
      const stats = await trackingDatabaseService.getStatistics();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return reply.code(500).send(createInternalErrorResponse(error));
    }
  });

  // GET /tracking/cron/status - Get cron job status
  fastify.get('/cron/status', async (request, reply) => {
    try {
      const status = trackingCronService.getStatus();
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      return reply.code(500).send(createInternalErrorResponse(error));
    }
  });

  // POST /tracking/cron/trigger - Manually trigger cron job update
  fastify.post('/cron/trigger', async (request, reply) => {
    try {
      // Trigger update asynchronously
      trackingCronService.triggerUpdate().catch((error) => {
        console.error('Error in manual cron trigger:', error);
      });

      return {
        success: true,
        message: 'Tracking update triggered',
      };
    } catch (error) {
      return reply.code(500).send(createInternalErrorResponse(error));
    }
  });

  // POST /report - Generate tracking report in JSON or CSV format
  fastify.post('/report', async (request, reply) => {
    try {
      const reportRequest = request.body as ReportRequest;

      // Validate request
      const validation = reportService.validateRequest(reportRequest);
      if (!validation.valid) {
        return reply.code(400).send(
          createValidationErrorResponse(validation.errors.join('; '))
        );
      }

      // Generate report
      const report = await reportService.generateReport(reportRequest);

      // Set appropriate content type based on format
      if (report.format === 'csv') {
        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', `attachment; filename="tracking-report-${Date.now()}.csv"`);
        return report.csv;
      } else {
        // JSON format
        return {
          success: true,
          ...report,
        };
      }
    } catch (error) {
      console.error('Report generation failed:', error);
      return reply.code(500).send(createInternalErrorResponse(error));
    }
  });
};

export default trackingRoutes;

