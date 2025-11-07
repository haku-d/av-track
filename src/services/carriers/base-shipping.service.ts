import { 
  ShippingRequest, 
  VoidRequest, 
  ShippingResponse, 
  VoidResponse, 
  ValidationResponse 
} from '../../types/shipping.types';

/**
 * Base interface that all carrier shipping services must implement
 * This ensures a consistent API across different carriers (Purolator, UPS, FedEx, etc.)
 */
export interface IShippingService {
  /**
   * Initialize the shipping service (e.g., create SOAP client, setup API connection)
   */
  initialize(): Promise<void>;

  /**
   * Create a new shipment and return tracking numbers and labels
   * @param request - Shipping request with shipment details and printer type
   * @returns Shipping response with PINs and success status
   */
  createShipment(request: ShippingRequest): Promise<ShippingResponse>;

  /**
   * Validate shipment data without creating actual shipment
   * @param request - Shipping request with shipment details to validate
   * @returns Validation response indicating if shipment data is valid
   */
  validateShipment(request: ShippingRequest): Promise<ValidationResponse>;

  /**
   * Void/cancel an existing shipment
   * @param request - Void request with PIN to cancel
   * @returns Void response indicating success/failure
   */
  voidShipment(request: VoidRequest): Promise<VoidResponse>;

  /**
   * Get the carrier name
   */
  getCarrierName(): string;

  /**
   * Check if the service is initialized and ready
   */
  isReady(): boolean;
}

/**
 * Abstract base class for shipping services
 * Provides common functionality that can be shared across carriers
 */
export abstract class BaseShippingService implements IShippingService {
  protected initialized: boolean = false;

  abstract initialize(): Promise<void>;
  abstract createShipment(request: ShippingRequest): Promise<ShippingResponse>;
  abstract validateShipment(request: ShippingRequest): Promise<ValidationResponse>;
  abstract voidShipment(request: VoidRequest): Promise<VoidResponse>;
  abstract getCarrierName(): string;

  isReady(): boolean {
    return this.initialized;
  }

  /**
   * Helper method to ensure service is initialized before use
   */
  protected async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Helper method to validate required fields in shipment
   */
  protected validateShipmentRequest(request: ShippingRequest): string[] {
    const errors: string[] = [];

    if (!request.shipment) {
      errors.push('Shipment data is required');
      return errors;
    }

    const { shipment } = request;

    if (!shipment.SenderInformation) {
      errors.push('Sender information is required');
    }

    if (!shipment.ReceiverInformation) {
      errors.push('Receiver information is required');
    }

    if (!shipment.PackageInformation) {
      errors.push('Package information is required');
    }

    if (!shipment.PaymentInformation) {
      errors.push('Payment information is required');
    }

    if (!shipment.PickupInformation) {
      errors.push('Pickup information is required');
    }

    return errors;
  }

  /**
   * Helper method to validate PIN format
   */
  protected validatePIN(pin: string): boolean {
    // Basic PIN validation - can be overridden by specific carriers
    return !!(pin && pin.length > 0 && /^[A-Z0-9]+$/.test(pin));
  }
}
