import { FastifyPluginAsync } from 'fastify';
import { purolatorShippingService } from '../../services/carriers/purolator-shipping.service';
import { validateShippingConfig } from '../../config/purolator-shipping.config';
import { ShippingRequest, VoidRequest } from '../../types/shipping.types';
import { createValidationErrorResponse, createInternalErrorResponse } from '../../utils/error-response';

/**
 * Shipping routes plugin
 * Provides REST API endpoints for Purolator shipping operations
 */
const shippingRoutes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  
  // Health check for shipping service
  fastify.get('/health', async (request, reply) => {
    const configValidation = validateShippingConfig();

    if (!configValidation.valid) {
      return reply.code(503).send({
        status: 'unhealthy',
        errors: configValidation.errors,
      });
    }

    return {
      status: 'healthy',
      service: 'Purolator Shipping Service',
      version: '1.0',
      carrier: purolatorShippingService.getCarrierName(),
      ready: purolatorShippingService.isReady(),
    };
  });

  // Create shipment
  fastify.post<{
    Body: ShippingRequest;
  }>('/create', {
    schema: {
      body: {
        type: 'object',
        required: ['shipment'],
        properties: {
          shipment: {
            type: 'object',
            required: ['SenderInformation', 'ReceiverInformation', 'PackageInformation', 'PaymentInformation', 'PickupInformation'],
            properties: {
              SenderInformation: { 
                type: 'object',
                required: ['Address'],
                properties: {
                  Address: { type: 'object' },
                  TaxNumber: { type: 'string' }
                }
              },
              ReceiverInformation: { 
                type: 'object',
                required: ['Address'],
                properties: {
                  Address: { type: 'object' },
                  TaxNumber: { type: 'string' }
                }
              },
              PackageInformation: { 
                type: 'object',
                required: ['ServiceID', 'TotalWeight', 'TotalPieces'],
                properties: {
                  ServiceID: { type: 'string' },
                  Description: { type: 'string' },
                  TotalWeight: { type: 'object' },
                  TotalPieces: { type: 'integer' },
                  PiecesInformation: { type: 'array' },
                  DangerousGoodsDeclarationDocumentIndicator: { type: 'boolean' },
                  OptionsInformation: { type: 'object' }
                }
              },
              PaymentInformation: { 
                type: 'object',
                required: ['PaymentType', 'RegisteredAccountNumber'],
                properties: {
                  PaymentType: { type: 'string', enum: ['Sender', 'Receiver', 'ThirdParty', 'CreditCard'] },
                  RegisteredAccountNumber: { type: 'string' },
                  BillingAccountNumber: { type: 'string' },
                  CreditCardInformation: { type: 'object' }
                }
              },
              PickupInformation: { 
                type: 'object',
                required: ['PickupType'],
                properties: {
                  PickupType: { type: 'string' }
                }
              },
              ShipmentDate: { type: 'string' },
              FromOnLabelIndicator: { type: 'boolean' },
              FromOnLabelInformation: { type: 'object' },
              InternationalInformation: { type: 'object' },
              ReturnShipmentInformation: { type: 'object' },
              NotificationInformation: { type: 'object' },
              TrackingReferenceInformation: { type: 'object' },
              OtherInformation: { type: 'object' },
              ProactiveNotification: { type: 'object' }
            }
          },
          printerType: { 
            type: 'string', 
            enum: ['Regular', 'Thermal'],
            default: 'Regular'
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await purolatorShippingService.createShipment(request.body);

      if (!result.success) {
        return reply.code(400).send(result);
      }

      return result;
    } catch (error) {
      console.error('Create shipment error:', error);
      return reply.code(500).send(createInternalErrorResponse(error));
    }
  });

  // Validate shipment
  fastify.post<{
    Body: ShippingRequest;
  }>('/validate', {
    schema: {
      body: {
        type: 'object',
        required: ['shipment'],
        properties: {
          shipment: { type: 'object' },
          printerType: { 
            type: 'string', 
            enum: ['Regular', 'Thermal']
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await purolatorShippingService.validateShipment(request.body);

      if (!result.success) {
        return reply.code(400).send(result);
      }

      return result;
    } catch (error) {
      console.error('Validate shipment error:', error);
      return reply.code(500).send(createInternalErrorResponse(error));
    }
  });

  // Void shipment
  fastify.post<{
    Body: VoidRequest;
  }>('/void', {
    schema: {
      body: {
        type: 'object',
        required: ['pin'],
        properties: {
          pin: {
            type: 'string',
            minLength: 1,
            pattern: '^[A-Z0-9]+$'
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await purolatorShippingService.voidShipment(request.body);

      if (!result.success) {
        return reply.code(400).send(result);
      }

      return result;
    } catch (error) {
      console.error('Void shipment error:', error);
      return reply.code(500).send(createInternalErrorResponse(error));
    }
  });

  // Void shipment by PIN (DELETE route for convenience)
  fastify.delete<{
    Params: { pin: string };
  }>('/void/:pin', async (request, reply) => {
    const { pin } = request.params;

    if (!pin) {
      return reply.code(400).send(
        createValidationErrorResponse('PIN parameter is required')
      );
    }

    if (!/^[A-Z0-9]+$/.test(pin)) {
      return reply.code(400).send(
        createValidationErrorResponse('PIN must contain only alphanumeric characters')
      );
    }

    try {
      const result = await purolatorShippingService.voidShipment({ pin });

      if (!result.success) {
        return reply.code(400).send(result);
      }

      return result;
    } catch (error) {
      console.error('Void shipment error:', error);
      return reply.code(500).send(createInternalErrorResponse(error));
    }
  });

  // Get service description (debugging)
  fastify.get('/describe', async (request, reply) => {
    try {
      const description = await purolatorShippingService.describe();
      return {
        success: true,
        carrier: purolatorShippingService.getCarrierName(),
        ready: purolatorShippingService.isReady(),
        description
      };
    } catch (error) {
      console.error('Describe service error:', error);
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get last SOAP request/response (debugging)
  fastify.get('/debug/last-request', async (request, reply) => {
    try {
      const lastRequest = purolatorShippingService.getLastRequest();
      const lastResponse = purolatorShippingService.getLastResponse();

      return {
        success: true,
        lastRequest,
        lastResponse
      };
    } catch (error) {
      console.error('Debug request error:', error);
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};

export default shippingRoutes;
