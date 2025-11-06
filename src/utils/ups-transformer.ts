/**
 * Utility to transform UPS API responses to standardized JSON format
 */

import {
  TrackingResponse,
  StandardizedShipment,
  StandardizedAddress,
  StandardizedPackage,
  StandardizedEvent,
  StandardizedLocation,
} from '../types/shipment-tracking.types';

/**
 * UPS API Response Types
 */
interface UpsTrackApiResponse {
  trackResponse: {
    shipment: UpsShipment[];
  };
}

interface UpsShipment {
  inquiryNumber: string;
  package: UpsPackage[];
  warnings?: UpsWarning[];
}

interface UpsPackage {
  trackingNumber: string;
  activity?: UpsActivity[];
  currentStatus?: UpsStatus;
  deliveryDate?: UpsDeliveryDate[];
  deliveryTime?: UpsDeliveryTime;
  packageAddress?: UpsPackageAddress[];
  service?: UpsService;
  weight?: UpsWeight;
  dimension?: UpsDimension;
  referenceNumber?: UpsReferenceNumber[];
}

interface UpsActivity {
  date: string; // YYYYMMDD
  time: string; // HHMMSS
  gmtDate?: string;
  gmtTime?: string;
  gmtOffset?: string;
  status: UpsStatus;
  location?: UpsLocation;
}

interface UpsStatus {
  code: string;
  description: string;
  statusCode?: string;
  type?: string;
}

interface UpsLocation {
  address?: UpsAddress;
  slic?: string;
}

interface UpsAddress {
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
}

interface UpsPackageAddress {
  type: string; // ORIGIN or DESTINATION
  address: UpsAddress;
  name?: string;
  attentionName?: string;
}

interface UpsDeliveryDate {
  type: string; // SDD, RDD, DEL
  date: string; // YYYYMMDD
}

interface UpsDeliveryTime {
  type: string; // EOD, CMT, EDW, CDW, IDW, DEL
  startTime?: string;
  endTime?: string;
}

interface UpsService {
  code: string;
  description: string;
  levelCode?: string;
}

interface UpsWeight {
  unitOfMeasurement: string;
  weight: string;
}

interface UpsDimension {
  unitOfDimension: string;
  length: string;
  width: string;
  height: string;
}

interface UpsReferenceNumber {
  number: string;
  type: string;
}

interface UpsWarning {
  code: string;
  message: string;
}

/**
 * Transform UPS API response to standardized TrackingResponse format
 */
export function transformUpsResponse(
  upsResponse: UpsTrackApiResponse,
  trackingNumber: string
): TrackingResponse {
  try {
    const trackResponse = upsResponse?.trackResponse;
    
    if (!trackResponse || !trackResponse.shipment || trackResponse.shipment.length === 0) {
      return createErrorResponse('No shipment data found in UPS response');
    }

    const shipment = trackResponse.shipment[0];
    const packages = shipment.package || [];

    if (packages.length === 0) {
      return createErrorResponse('No package data found in UPS response');
    }

    // Find the package matching the tracking number
    const pkg = packages.find(p => p.trackingNumber === trackingNumber) || packages[0];

    // Extract warnings as errors
    const errors: string[] = [];
    if (shipment.warnings && shipment.warnings.length > 0) {
      errors.push(...shipment.warnings.map(w => `${w.code}: ${w.message}`));
    }

    // Determine status
    const status = errors.length > 0 ? 'warning' : 'success';
    const description = pkg.currentStatus?.description || 'Tracking information retrieved';

    return {
      status,
      description,
      errors,
      shipment: transformUpsShipment(pkg, shipment),
    };
  } catch (error) {
    console.error('Error transforming UPS response:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to transform UPS response'
    );
  }
}

/**
 * Transform UPS package to standardized shipment format
 * https://developer.ups.com/api/reference/tracking/appendix?loc=en_US
 *
 * UPS Status Code 011 = Delivered
 */
function transformUpsShipment(pkg: UpsPackage, shipment: UpsShipment): StandardizedShipment {
  // Extract shipper and receiver addresses
  const addresses = pkg.packageAddress || [];
  const shipperAddress = addresses.find(a => a.type === 'ORIGIN');
  const receiverAddress = addresses.find(a => a.type === 'DESTINATION');

  // Determine shipment created date from the oldest activity or delivery date
  const activities = pkg.activity || [];
  let createdDate = new Date();
  if (activities.length > 0) {
    const oldestActivity = activities[activities.length - 1];
    createdDate = parseUpsDateTime(oldestActivity.date, oldestActivity.time);
  }

  // Check if shipment is delivered (UPS status code 011)
  const statusCode = pkg.currentStatus?.code || '';
  const isDelivered = statusCode === '011';

  return {
    status: statusCode,
    description: pkg.currentStatus?.description || '',
    isDelivered,
    createdDate,
    shipper: transformUpsAddress(shipperAddress?.address),
    receiver: transformUpsAddress(receiverAddress?.address),
    packages: [transformUpsPackage(pkg)],
  };
}

/**
 * Transform UPS address to standardized format
 */
function transformUpsAddress(address?: UpsAddress): StandardizedAddress {
  return {
    city: address?.city || '',
    proviceState: address?.stateProvince || '',
    countryCode: address?.countryCode || address?.country || '',
    postalZipCode: address?.postalCode || '',
  };
}

/**
 * Transform UPS package to standardized format
 */
function transformUpsPackage(pkg: UpsPackage): StandardizedPackage {
  const activities = pkg.activity || [];

  return {
    pin: pkg.trackingNumber,
    status: pkg.currentStatus?.code || '',
    description: pkg.currentStatus?.description || '',
    lastEvent: activities.length > 0 ? transformUpsActivity(activities[0]) : createEmptyEvent(),
  };
}

/**
 * Transform UPS activity to standardized event format
 */
function transformUpsActivity(activity: UpsActivity): StandardizedEvent {
  return {
    dateTime: parseUpsDateTime(activity.date, activity.time),
    code: activity.status.code || '',
    description: activity.status.description || '',
    location: transformUpsLocation(activity.location),
  };
}

/**
 * Transform UPS location to standardized format
 */
function transformUpsLocation(location?: UpsLocation): StandardizedLocation {
  const address = location?.address;
  
  return {
    address_1: address?.addressLine1 || '',
    address_2: address?.addressLine2 || '',
    city: address?.city || '',
    proviceState: address?.stateProvince || '',
    countryCode: address?.countryCode || address?.country || '',
    postalZipCode: address?.postalCode || '',
  };
}

/**
 * Parse UPS date and time strings to Date object
 * @param date - Format: YYYYMMDD
 * @param time - Format: HHMMSS
 */
function parseUpsDateTime(date: string, time: string): Date {
  try {
    // Parse date: YYYYMMDD
    const year = parseInt(date.substring(0, 4), 10);
    const month = parseInt(date.substring(4, 6), 10) - 1; // Month is 0-indexed
    const day = parseInt(date.substring(6, 8), 10);

    // Parse time: HHMMSS
    const hours = parseInt(time.substring(0, 2), 10);
    const minutes = parseInt(time.substring(2, 4), 10);
    const seconds = parseInt(time.substring(4, 6), 10);

    return new Date(year, month, day, hours, minutes, seconds);
  } catch (error) {
    console.error('Error parsing UPS date/time:', error);
    return new Date();
  }
}

/**
 * Create an empty event for packages with no activities
 */
function createEmptyEvent(): StandardizedEvent {
  return {
    dateTime: new Date(),
    code: '',
    description: '',
    location: {
      address_1: '',
      address_2: '',
      city: '',
      proviceState: '',
      countryCode: '',
      postalZipCode: '',
    },
  };
}

/**
 * Create an error response
 */
function createErrorResponse(errorMessage: string): TrackingResponse {
  return {
    status: 'ERROR',
    description: errorMessage,
    errors: [errorMessage],
    shipment: {
      status: 'ERROR',
      description: errorMessage,
      isDelivered: false,
      createdDate: new Date(),
      shipper: {
        city: '',
        proviceState: '',
        countryCode: '',
        postalZipCode: '',
      },
      receiver: {
        city: '',
        proviceState: '',
        countryCode: '',
        postalZipCode: '',
      },
      packages: [],
    },
  };
}

