/**
 * TypeScript types for Purolator Shipping Service
 * Generated from ShippingService.wsdl
 */

// Base types from existing tracking types
export type { RequestContext, ResponseContext, Language } from './shipment-tracking.types';

// Shared Purolator types
export type { PurolatorCredentials, PurolatorServiceConfig } from './purolator-common.types';

// Printer types
export type PrinterType = 'Regular' | 'Thermal';

// PIN (Tracking Number) structure
export interface PIN {
  Value: string;
}

export interface ArrayOfPIN {
  PIN: PIN[];
}

// Request containers
export interface CreateShipmentRequestContainer {
  Shipment: Shipment;
  PrinterType: PrinterType;
}

export interface VoidShipmentRequestContainer {
  PIN: PIN;
}

export interface ValidateShipmentRequestContainer {
  Shipment: Shipment;
}

// Response containers
export interface CreateShipmentResponseContainer {
  ResponseInformation: ResponseInformation;
  ShipmentPIN?: PIN;
  PiecePINs?: ArrayOfPIN;
  ReturnShipmentPINs?: ArrayOfPIN;
  ExpressChequePIN?: PIN;
}

export interface VoidShipmentResponseContainer {
  ResponseInformation: ResponseInformation;
}

export interface ValidateShipmentResponseContainer {
  ResponseInformation: ResponseInformation;
  // Additional validation response fields would go here
}

// Reuse existing types from tracking
export interface ResponseInformation {
  Errors: Error[];
  InformationalMessages: InformationalMessage[];
}

export interface Error {
  Code: string;
  Description: string;
  AdditionalInformation: string;
}

export interface InformationalMessage {
  Code: string;
  Message: string;
}

// Shipment structure (reuse from WSDL analysis)
export interface Shipment {
  SenderInformation: SenderInformation;
  ReceiverInformation: ReceiverInformation;
  FromOnLabelIndicator?: boolean;
  FromOnLabelInformation?: FromOnLabelInformation;
  ShipmentDate?: string;
  PackageInformation: PackageInformation;
  InternationalInformation?: InternationalInformation;
  ReturnShipmentInformation?: ReturnShipmentInformation;
  PaymentInformation: PaymentInformation;
  PickupInformation: PickupInformation;
  NotificationInformation?: NotificationInformation;
  TrackingReferenceInformation?: TrackingReferenceInformation;
  OtherInformation?: OtherInformation;
  ProactiveNotification?: ProactiveNotification;
}

// Import Service type from existing tracking types
export type { Service } from './shipment-tracking.types';

// Define Weight interface for shipping (different from tracking Weight)
export interface Weight {
  Value: number;
  WeightUnit: WeightUnit;
}

// Define Address and PhoneNumber based on WSDL
export interface PhoneNumber {
  CountryCode: string;
  AreaCode: string;
  Phone: string;
  Extension?: string;
}

export interface Address {
  Name: string;
  Company?: string;
  Department?: string;
  StreetNumber: string;
  StreetSuffix?: string;
  StreetName: string;
  StreetType?: string;
  StreetDirection?: string;
  Suite?: string;
  Floor?: string;
  StreetAddress2?: string;
  StreetAddress3?: string;
  City: string;
  Province: string;
  Country: string;
  PostalCode: string;
  PhoneNumber: PhoneNumber;
  FaxNumber?: PhoneNumber;
}

// Define shipping-specific types that may not exist in tracking types
export interface SenderInformation {
  Address: Address;
  TaxNumber?: string;
}

export interface ReceiverInformation {
  Address: Address;
  TaxNumber?: string;
}

export interface FromOnLabelInformation {
  Address: Address;
}

export interface TotalWeight {
  Value: number;
  WeightUnit: WeightUnit;
}

export type WeightUnit = 'lb' | 'kg';
export type DimensionUnit = 'in' | 'cm';

export interface Dimension {
  Value: number;
  DimensionUnit: DimensionUnit;
}

export interface OptionIDValuePair {
  ID: string;
  Value: string;
}

export interface ArrayOfOptionIDValuePair {
  OptionIDValuePair: OptionIDValuePair[];
}

export interface Piece {
  Weight: Weight;
  Length?: Dimension;
  Width?: Dimension;
  Height?: Dimension;
  Options?: ArrayOfOptionIDValuePair;
}

export interface ArrayOfPiece {
  Piece: Piece[];
}

export interface OptionsInformation {
  Options: ArrayOfOptionIDValuePair;
  ExpressChequeAddress?: Address;
}

export interface PackageInformation {
  ServiceID: string;
  Description?: string;
  TotalWeight: TotalWeight;
  TotalPieces: number;
  PiecesInformation?: ArrayOfPiece;
  DangerousGoodsDeclarationDocumentIndicator?: boolean;
  OptionsInformation?: OptionsInformation;
}

export type PaymentType = 'Sender' | 'Receiver' | 'ThirdParty' | 'CreditCard';
export type CreditCardType = 'Visa' | 'MasterCard' | 'AmericanExpress';

export interface CreditCardInformation {
  Type: CreditCardType;
  Number: string;
  Name: string;
  ExpiryMonth: number;
  ExpiryYear: number;
  CVV: string;
  BillingPostalCode: string;
}

export interface PaymentInformation {
  PaymentType: PaymentType;
  RegisteredAccountNumber: string;
  BillingAccountNumber?: string;
  CreditCardInformation?: CreditCardInformation;
}

export interface PickupInformation {
  PickupType: string;
}

export interface NotificationInformation {
  // Define based on WSDL structure - placeholder for now
  [key: string]: any;
}

export interface TrackingReferenceInformation {
  // Define based on WSDL structure - placeholder for now
  [key: string]: any;
}

export interface OtherInformation {
  // Define based on WSDL structure - placeholder for now
  [key: string]: any;
}

export interface ProactiveNotification {
  // Define based on WSDL structure - placeholder for now
  [key: string]: any;
}

export interface InternationalInformation {
  DocumentsOnlyIndicator: boolean;
  // Add other fields as needed
  [key: string]: any;
}

export interface ReturnShipmentInformation {
  // Define based on WSDL structure - placeholder for now
  [key: string]: any;
}

// Simplified request/response interfaces for REST API
export interface ShippingRequest {
  shipment: Shipment;
  printerType?: PrinterType;
}

export interface VoidRequest {
  pin: string;
}

export interface ShippingResponse {
  success: boolean;
  errors?: Error[];
  messages?: InformationalMessage[];
  shipmentPIN?: string;
  piecePINs?: string[];
  returnShipmentPINs?: string[];
  expressChequePIN?: string;
}

export interface VoidResponse {
  success: boolean;
  errors?: Error[];
  messages?: InformationalMessage[];
}

export interface ValidationResponse {
  success: boolean;
  errors?: Error[];
  messages?: InformationalMessage[];
  isValid: boolean;
}
