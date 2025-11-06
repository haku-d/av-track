/**
 * TypeScript types for Purolator Shipment Tracking Service
 * Generated from ShipmentTrackingService.wsdl
 */

export type Language = 'en' | 'fr';

export interface RequestContext {
  Version: string;
  Language: Language;
  GroupID: string;
  RequestReference: string;
  UserToken?: string;
}

export interface ResponseContext {
  ResponseReference: string;
}

export interface Search {
  trackingId: string;
  shipmentDateFrom?: string;
  shipmentDateTo?: string;
  pod?: boolean;
  shipmentView?: boolean;
  account?: string;
  destinationPostalZipCode?: string;
  eventSortOrder?: string;
}

export interface ArrayOfsearch {
  search: Search[];
}

export interface TrackingDetailCriterion {
  searches: ArrayOfsearch;
}

export interface TrackingByPinsOrReferencesRequest {
  TrackingSearchCriteria: TrackingDetailCriterion;
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

export interface ResponseInformation {
  Errors: Error[];
  InformationalMessages: InformationalMessage[];
}

export interface ShipmentError {
  code?: string;
  description?: string;
}

export interface Status {
  code?: string;
  description?: string;
}

export interface TrackingPackageStatus {
  code?: string;
  description?: string;
  subCode?: string;
  subDescription?: string;
}

export interface TrackingAddress {
  streetAddress1?: string;
  streetAddress2?: string;
  streetAddress3?: string;
  city?: string;
  provinceState?: string;
  countryCode?: string;
  postalZipCode?: string;
}

export interface TrackingPackageLocation {
  StreetAddress1?: string;
  StreetAddress2?: string;
  City?: string;
  provinceState?: string;
  CountryCode?: string;
  PostalCode?: string;
}

export interface Weight {
  unit?: string;
  value?: number;
}

export interface TrackingPackageWeight {
  declaredUnit?: string;
  declaredValue?: number;
  actualUnit?: string;
  actualValue?: number;
}

export interface Service {
  name?: string;
  value?: string;
  description?: string;
}

export interface TrackingPackageAdditionalInfo {
  AT701?: string;
  AT702?: string;
}

export interface TrackingPackageDeliveryDetails {
  name?: string;
  deliveryDateTime?: string;
  image?: string;
  locationCode?: string;
  locationDescription?: string;
}

export interface TrackingReferenceOfString {
  reference: string[];
}

export interface TrackingPackageDetail {
  references?: TrackingReferenceOfString;
  services?: Service[];
  weight?: TrackingPackageWeight;
  holdForPickupLocationId?: string;
  deliveryDetails?: TrackingPackageDeliveryDetails;
}

export interface Event {
  dateTime?: string;
  code?: string;
  reasonCode?: string;
  description?: string;
  terminal?: string;
  routeId?: string;
  location?: TrackingPackageLocation;
  x12?: TrackingPackageAdditionalInfo;
  xreference?: string;
}

export interface Package {
  pin: string;
  status?: TrackingPackageStatus;
  estimatedDeliveryDate?: string;
  transitDays?: number;
  packageCreated?: string;
  packageReceived?: string;
  lastEvent?: Event;
  details?: TrackingPackageDetail;
  events?: Event[];
}

export interface ShipmentDetails {
  reference1?: string;
  reference2?: string;
  reference3?: string;
  reference4?: string;
  reference5?: string;
  returnShipment?: boolean;
  product?: Status;
  services?: Service[];
  shipper?: TrackingAddress;
  receiver?: TrackingAddress;
  note?: string;
  weight?: Weight;
}

export interface ShipmentInfo {
  shipmentPin: string;
  status?: Status;
  shipmentCreated?: string;
  pieceTotalCount?: number;
  details?: ShipmentDetails;
  packages: Package[];
}

export interface SearchResult {
  trackingId: string;
  shipmentDateFrom?: string;
  shipmentDateTo?: string;
  status?: string;
  type?: string;
  shipmentErrors?: ShipmentError[];
  Shipment?: ShipmentInfo;
}

export interface TrackingByPinsOrReferencesResponse {
  ResponseInformation: ResponseInformation;
  SearchResults?: SearchResult[];
}

/**
 * Configuration for Purolator API
 */
export interface PurolatorConfig {
  wsdlUrl: string;
  endpoint: string;
  activationKey: string;
  registeredAccountNumber: string;
  version: string;
  language: Language;
  groupId: string;
}

/**
 * Simplified request interface for REST API
 */
export interface TrackingRequest {
  trackingIds: string[];
  shipmentDateFrom?: string;
  shipmentDateTo?: string;
  pod?: boolean;
  shipmentView?: boolean;
  account?: string;
  destinationPostalZipCode?: string;
  eventSortOrder?: 'ASC' | 'DESC';
}

/**
 * Simplified response interface for REST API (Legacy)
 */
export interface TrackingResponseLegacy {
  success: boolean;
  errors?: Error[];
  messages?: InformationalMessage[];
  results?: SearchResult[];
}

/**
 * Standardized address interface for shipper/receiver
 */
export interface StandardizedAddress {
  city: string;
  proviceState: string;
  countryCode: string;
  postalZipCode: string;
}

/**
 * Standardized location interface for events
 */
export interface StandardizedLocation {
  address_1: string;
  address_2: string;
  city: string;
  proviceState: string;
  countryCode: string;
  postalZipCode: string;
}

/**
 * Standardized event interface
 */
export interface StandardizedEvent {
  dateTime: Date;
  code: string;
  description: string;
  location: StandardizedLocation;
}

/**
 * Standardized package interface
 */
export interface StandardizedPackage {
  pin?: string; // Tracking ID (PIN)
  status: string;
  description: string;
  lastEvent: StandardizedEvent;
}

/**
 * Standardized shipment interface
 */
export interface StandardizedShipment {
  status: string;
  description: string;
  isDelivered: boolean;
  createdDate: Date;
  shipper: StandardizedAddress;
  receiver: StandardizedAddress;
  packages: StandardizedPackage[];
}

/**
 * New standardized tracking response interface
 */
export interface TrackingResponse {
  status: string;
  description: string;
  errors: string[];
  shipment: StandardizedShipment;
}

