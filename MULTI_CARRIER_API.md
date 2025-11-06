# Multi-Carrier Tracking API Documentation

## Overview

The e-tracking application now supports **generic multi-carrier tracking** with a unified API pattern. All carriers (Purolator, UPS, FedEx, DHL, Stampede) use the same endpoint structure.

## Generic Endpoint Pattern

All carrier-specific tracking operations use the pattern:

```
/tracking/:service/:trackingNumber
```

Where:
- `:service` = Carrier name (`purolator`, `ups`, `fedex`, `dhl`, `stampede`)
- `:trackingNumber` = The shipment tracking number

---

## Supported Carriers

| Carrier | Service Value | Status |
|---------|--------------|--------|
| Purolator | `purolator` | ✅ Active |
| UPS | `ups` | ✅ Active |
| FedEx | `fedex` | 🔜 Coming Soon |
| DHL | `dhl` | 🔜 Coming Soon |
| Stampede | `stampede` | 🔜 Coming Soon |

---

## API Endpoints

### 1. Quick Track (No Storage)

**GET** `/tracking/:service/:trackingNumber`

Track a shipment without storing it in the database. Returns real-time tracking information.

#### Example Requests:

```bash
# Track UPS shipment
GET /tracking/ups/1Z12345E0205271688

# Track Purolator shipment
GET /tracking/purolator/335702383951

# Track with query parameters (Purolator-specific)
GET /tracking/purolator/335702383951?shipmentDateFrom=2024-01-01&pod=true
```

#### Query Parameters (Purolator only):

| Parameter | Type | Description |
|-----------|------|-------------|
| `shipmentDateFrom` | string | Start date for shipment search (YYYY-MM-DD) |
| `shipmentDateTo` | string | End date for shipment search (YYYY-MM-DD) |
| `pod` | boolean | Include Proof of Delivery (true/false) |
| `shipmentView` | boolean | Include detailed shipment view (true/false) |

#### Response:

```json
{
  "status": "success",
  "description": "Tracking information retrieved successfully",
  "shipment": {
    "trackingNumber": "1Z12345E0205271688",
    "carrier": "UPS",
    "status": "In Transit",
    "estimatedDelivery": "2024-11-10T17:00:00Z",
    "currentLocation": "Los Angeles, CA",
    "events": [
      {
        "timestamp": "2024-11-05T10:30:00Z",
        "location": "Los Angeles, CA",
        "status": "Departed Facility",
        "description": "Package has departed the facility"
      }
    ]
  }
}
```

---

### 2. Track and Store (Continuous Monitoring)

**POST** `/tracking/:service/:trackingNumber`

Track a shipment and store it in the database for continuous monitoring via cron job (updates every 30 minutes).

#### Example Requests:

```bash
# Store UPS shipment for tracking
POST /tracking/ups/1Z12345E0205271688

# Store Purolator shipment for tracking
POST /tracking/purolator/335702383951
```

#### Response:

```json
{
  "success": true,
  "message": "UPS shipment is now being tracked",
  "data": {
    "trackingNo": "1Z12345E0205271688",
    "service": "ups",
    "isActive": true,
    "lastUpdated": "2024-11-05T10:30:00Z",
    "createdAt": "2024-11-05T10:30:00Z",
    "trackingResponse": {
      "status": "success",
      "shipment": { ... }
    }
  }
}
```

---

### 3. Get Stored Status

**GET** `/tracking/:service/:trackingNumber/status`

Retrieve the stored tracking status from the database (last cached result).

#### Example Requests:

```bash
# Get stored UPS tracking status
GET /tracking/ups/1Z12345E0205271688/status

# Get stored Purolator tracking status
GET /tracking/purolator/335702383951/status
```

#### Response:

```json
{
  "success": true,
  "data": {
    "trackingNo": "1Z12345E0205271688",
    "service": "ups",
    "isActive": true,
    "lastUpdated": "2024-11-05T11:00:00Z",
    "createdAt": "2024-11-05T10:30:00Z",
    "errorCount": 0,
    "lastError": null,
    "trackingResponse": {
      "status": "success",
      "shipment": { ... }
    }
  }
}
```

---

### 4. Stop Tracking

**DELETE** `/tracking/:service/:trackingNumber`

Stop tracking a shipment and remove it from the database.

#### Example Requests:

```bash
# Stop tracking UPS shipment
DELETE /tracking/ups/1Z12345E0205271688

# Stop tracking Purolator shipment
DELETE /tracking/purolator/335702383951
```

#### Response:

```json
{
  "success": true,
  "message": "UPS shipment tracking stopped"
}
```

---

## General Endpoints

### Get Tracking Statistics

**GET** `/tracking/stats`

Get statistics about all tracked shipments.

#### Response:

```json
{
  "success": true,
  "data": {
    "totalShipments": 150,
    "activeShipments": 120,
    "inactiveShipments": 30,
    "byCarrier": {
      "purolator": 80,
      "ups": 70
    }
  }
}
```

---

### Get Cron Job Status

**GET** `/tracking/cron/status`

Get the status of the automatic tracking update cron job.

#### Response:

```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "schedule": "*/30 * * * *",
    "lastRun": "2024-11-05T11:00:00Z",
    "nextRun": "2024-11-05T11:30:00Z"
  }
}
```

---

### Trigger Cron Job Manually

**POST** `/tracking/cron/trigger`

Manually trigger the cron job to update all tracked shipments.

#### Response:

```json
{
  "success": true,
  "message": "Cron job update triggered successfully"
}
```

---

### Generate Multi-Carrier Report

**POST** `/tracking/report`

Generate a comprehensive report for multiple shipments across different carriers.

#### Request Body:

```json
{
  "shipments": [
    {
      "trackingNumber": "1Z12345E0205271688",
      "carrier": "ups"
    },
    {
      "trackingNumber": "335702383951",
      "carrier": "purolator"
    }
  ],
  "format": "json"
}
```

#### Response:

```json
{
  "success": true,
  "report": {
    "generatedAt": "2024-11-05T11:00:00Z",
    "totalShipments": 2,
    "shipments": [
      {
        "trackingNumber": "1Z12345E0205271688",
        "carrier": "ups",
        "status": "In Transit",
        "estimatedDelivery": "2024-11-10T17:00:00Z"
      },
      {
        "trackingNumber": "335702383951",
        "carrier": "purolator",
        "status": "Delivered",
        "deliveredAt": "2024-11-04T14:30:00Z"
      }
    ]
  }
}
```

---

## Error Responses

### Invalid Carrier

```json
{
  "status": "error",
  "message": "Carrier \"invalid\" is not supported. Supported carriers: purolator, ups, fedex, dhl, stampede"
}
```

### Tracking Number Not Found

```json
{
  "success": false,
  "message": "UPS shipment not found in tracking database"
}
```

### Validation Error

```json
{
  "status": "error",
  "message": "Tracking number is required"
}
```

---

## Migration from Old Endpoints

### Old Purolator Endpoints → New Generic Pattern

| Old Endpoint | New Endpoint |
|-------------|--------------|
| `POST /tracking/purolator/:pin` | `POST /tracking/purolator/:pin` |
| `GET /tracking/purolator/:pin/status` | `GET /tracking/purolator/:pin/status` |
| `DELETE /tracking/purolator/:pin` | `DELETE /tracking/purolator/:pin` |

### Old UPS Endpoints → New Generic Pattern

| Old Endpoint | New Endpoint |
|-------------|--------------|
| `POST /tracking/ups/:trackingNumber` | `POST /tracking/ups/:trackingNumber` |
| `GET /tracking/ups/:trackingNumber/status` | `GET /tracking/ups/:trackingNumber/status` |
| `DELETE /tracking/ups/:trackingNumber` | `DELETE /tracking/ups/:trackingNumber` |
| `GET /tracking/ups/:trackingNumber` | `GET /tracking/ups/:trackingNumber` |

**Note:** The endpoints remain the same! The refactoring is backward compatible.

---

## Adding New Carriers

To add a new carrier (e.g., FedEx):

1. Implement the carrier service extending `BaseTrackingService`
2. Register it in `tracking-service-factory.ts`
3. The generic routes automatically support it!

No route changes needed! 🎉

