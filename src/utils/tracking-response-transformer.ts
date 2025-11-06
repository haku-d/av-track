/**
 * Utility to transform SOAP tracking responses to standardized JSON format
 */

import {
  TrackingResponse,
  StandardizedShipment,
  StandardizedAddress,
  StandardizedPackage,
  StandardizedEvent,
  StandardizedLocation,
  ShipmentInfo,
  ShipmentError,
  Package,
  Event,
  TrackingAddress,
  TrackingPackageLocation,
  Error as PurolatorError,
} from '../types/shipment-tracking.types';

/**
 * Transform SOAP response to standardized TrackingResponse format
 *
 * The SOAP client returns an object/array where:
 * - soapResponse[0] contains ResponseInformation and SearchResults directly
 * OR
 * - soapResponse[0].TrackingByPinsOrReferencesResult contains ResponseInformation and SearchResults
 */
export function transformTrackingResponse(soapResponse: any): TrackingResponse {
  // Extract the response result from the SOAP response
  // The SOAP client can return the data in different formats
  let result = soapResponse[0];

  // Check if it's wrapped in TrackingByPinsOrReferencesResult
  if (result?.TrackingByPinsOrReferencesResult) {
    result = result.TrackingByPinsOrReferencesResult;
  }

  if (!result || (!result.ResponseInformation && !result.SearchResults)) {
    return {
      status: 'error',
      description: 'Invalid SOAP response structure',
      errors: ['No valid response data found in SOAP response'],
      shipment: createEmptyShipment(),
    };
  }

  const responseInfo = result.ResponseInformation;
  const searchResults = result.SearchResults;

  // Extract errors from ResponseInformation
  const errors: string[] = [];
  if (responseInfo?.Errors && Array.isArray(responseInfo.Errors) && responseInfo.Errors.length > 0) {
    errors.push(...responseInfo.Errors.map((err: PurolatorError) =>
      `${err.Code}: ${err.Description}${err.AdditionalInformation ? ' - ' + err.AdditionalInformation : ''}`
    ));
  }

  // Extract the first search result
  // SearchResults can be an array or an object with SearchResult property
  let searchResultsArray: any[] = [];
  if (Array.isArray(searchResults)) {
    searchResultsArray = searchResults;
  } else if (searchResults?.SearchResult) {
    searchResultsArray = Array.isArray(searchResults.SearchResult)
      ? searchResults.SearchResult
      : [searchResults.SearchResult];
  }

  const firstResult = searchResultsArray[0];

  // Handle shipment errors from SearchResult
  if (firstResult?.shipmentErrors && Array.isArray(firstResult.shipmentErrors) && firstResult.shipmentErrors.length > 0) {
    errors.push(...firstResult.shipmentErrors.map((err: ShipmentError) =>
      `${err.code || 'ERROR'}: ${err.description || 'Unknown error'}`
    ));
  }

  // Determine overall status and description based on search result status
  let status = 'success';
  let description = 'Tracking information retrieved successfully';

  if (errors.length > 0) {
    status = 'error';
    description = 'Tracking request completed with errors';
  } else if (!firstResult) {
    status = 'not_found';
    description = 'No search results found';
  } else if (firstResult.status === 'NOT_FOUND') {
    status = 'not_found';
    description = 'Shipment not found';
  } else if (!firstResult.Shipment) {
    status = 'not_found';
    description = 'No shipment information found';
  } else if (firstResult.status === 'FOUND') {
    status = 'success';
    description = 'Tracking information retrieved successfully';
  }

  // Transform shipment data
  const shipment = firstResult?.Shipment;

  return {
    status,
    description,
    errors,
    shipment: transformShipmentInfo(shipment),
  };
}

/**
 * Create an empty shipment for error cases
 */
function createEmptyShipment(): StandardizedShipment {
  return {
    status: '',
    description: '',
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
  };
}

/**
 * Transform shipment info to standardized format
 * Purolator Status Code DEL = Delivered
 */
function transformShipmentInfo(shipmentInfo?: ShipmentInfo): StandardizedShipment {
  if (!shipmentInfo) {
    return createEmptyShipment();
  }

  // Handle packages - can be an array or object with 'package' property
  let packagesArray: Package[] = [];
  if (shipmentInfo.packages) {
    if (Array.isArray(shipmentInfo.packages)) {
      packagesArray = shipmentInfo.packages;
    } else if ((shipmentInfo.packages as any).package) {
      // Handle case where packages is an object with 'package' property
      const pkg = (shipmentInfo.packages as any).package;
      packagesArray = Array.isArray(pkg) ? pkg : [pkg];
    }
  }

  // Check if shipment is delivered (Purolator status code DEL)
  const statusCode = shipmentInfo.status?.code || '';
  const isDelivered = statusCode === 'DEL';

  return {
    status: statusCode,
    description: shipmentInfo.status?.description || '',
    isDelivered,
    createdDate: shipmentInfo.shipmentCreated ? new Date(shipmentInfo.shipmentCreated) : new Date(),
    shipper: transformAddress(shipmentInfo.details?.shipper),
    receiver: transformAddress(shipmentInfo.details?.receiver),
    packages: packagesArray.map(transformPackage),
  };
}

/**
 * Transform address to standardized format
 */
function transformAddress(address?: TrackingAddress): StandardizedAddress {
  return {
    city: address?.city || '',
    proviceState: address?.provinceState || '',
    countryCode: address?.countryCode || '',
    postalZipCode: address?.postalZipCode || '',
  };
}

/**
 * Transform package to standardized format
 */
function transformPackage(pkg: Package): StandardizedPackage {
  // Handle events - can be an array or object with 'event' property
  let eventsArray: Event[] = [];

  if (pkg.events) {
    if (Array.isArray(pkg.events)) {
      eventsArray = pkg.events;
    } else if ((pkg.events as any).event) {
      // Handle case where events is an object with 'event' property
      const evt = (pkg.events as any).event;
      eventsArray = Array.isArray(evt) ? evt : [evt];
    }
  } else if (pkg.lastEvent) {
    // If no events array but lastEvent exists, use it
    eventsArray = [pkg.lastEvent];
  }

  // Get the most recent event (first in the array, as events are ordered newest to oldest)
  const mostRecentEvent = eventsArray.length > 0 ? eventsArray[0] : null;

  return {
    pin: pkg.pin,
    status: pkg.status?.code || '',
    description: pkg.status?.description || '',
    lastEvent: mostRecentEvent ? transformEvent(mostRecentEvent) : createEmptyEvent(),
  };
}

/**
 * Create an empty event for packages with no events
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
 * Transform event to standardized format
 */
function transformEvent(event: Event): StandardizedEvent {
  return {
    dateTime: event.dateTime ? new Date(event.dateTime) : new Date(),
    code: event.code || '',
    description: event.description || '',
    location: transformLocation(event.location),
  };
}

/**
 * Transform location to standardized format
 */
function transformLocation(location?: TrackingPackageLocation): StandardizedLocation {
  return {
    address_1: location?.StreetAddress1 || '',
    address_2: location?.StreetAddress2 || '',
    city: location?.City || '',
    proviceState: location?.provinceState || '',
    countryCode: location?.CountryCode || '',
    postalZipCode: location?.PostalCode || '',
  };
}

