# Tracking Storage & Cron Job Implementation

## 📋 Overview

Successfully implemented a complete tracking storage system with automatic updates via cron job. The system allows tracking shipments to be stored in MongoDB and automatically updated every 15 minutes.

## ✅ Completed Tasks

1. ✅ **Install MongoDB dependencies** - mongoose, node-cron, and type definitions
2. ✅ **Create MongoDB configuration** - Connection settings and validation
3. ✅ **Create MongoDB plugin** - Fastify plugin for database connection
4. ✅ **Create tracking database model** - Mongoose schema for tracked shipments
5. ✅ **Create tracking database service** - Service layer for database operations
6. ✅ **Add POST /tracking/purolator/:pin route** - Track and store shipments
7. ✅ **Create cron job service** - Automatic updates every 15 minutes
8. ✅ **Initialize cron job in app** - Start cron on application startup
9. 🔄 **Test the implementation** - Ready for testing

## 🏗️ Architecture

### Database Layer

**Model**: `src/models/tracked-shipment.model.ts`
- Mongoose schema with compound indexes
- Fields: trackingNo, service, trackingResponse, lastUpdated, isActive, errorCount, lastError
- Instance methods: `updateTracking()`, `recordError()`
- Static method: `findOrCreate()`

**Service**: `src/services/tracking-database.service.ts`
- `saveTrackedShipment()` - Save or update tracked shipment
- `getTrackedShipment()` - Get shipment by tracking number
- `getActiveTrackedShipments()` - Get all active shipments
- `getShipmentsNeedingUpdate()` - Get shipments older than X minutes
- `updateTrackingResponse()` - Update tracking data
- `recordError()` - Record tracking errors
- `deactivateShipment()` / `reactivateShipment()` - Manage shipment status
- `deleteTrackedShipment()` - Remove from tracking
- `getStatistics()` - Get tracking statistics

### Cron Job Service

**Service**: `src/services/tracking-cron.service.ts`
- Runs every 15 minutes: `*/15 * * * *`
- Updates all active shipments that haven't been updated in 15+ minutes
- Automatic error handling and retry logic
- Deactivates shipments after 10 consecutive errors
- 500ms delay between API calls to avoid overwhelming the service
- Methods:
  - `start()` - Start the cron job
  - `stop()` - Stop the cron job
  - `updateTrackedShipments()` - Update all tracked shipments
  - `triggerUpdate()` - Manually trigger an update
  - `getStatus()` - Get cron job status

### API Routes

**New Routes Added to** `src/routes/tracking/index.ts`:

1. **POST /tracking/purolator/:pin**
   - Track a shipment and store it for continuous monitoring
   - Returns: 201 Created with tracking data
   - Query params: shipmentDateFrom, shipmentDateTo, pod, shipmentView

2. **GET /tracking/purolator/:pin/status**
   - Get stored tracking status from database
   - Returns: Tracking data with metadata (lastUpdated, errorCount, etc.)

3. **DELETE /tracking/purolator/:pin**
   - Stop tracking a shipment (remove from database)
   - Returns: Success message

4. **GET /tracking/stats**
   - Get tracking statistics
   - Returns: Total, active, inactive counts and breakdown by service

5. **GET /tracking/cron/status**
   - Get cron job status
   - Returns: running and updating status

6. **POST /tracking/cron/trigger**
   - Manually trigger a cron job update
   - Returns: Success message (update runs asynchronously)

## 📁 Files Created/Modified

### Created Files:
- `src/config/mongodb.config.ts` - MongoDB configuration
- `src/plugins/mongodb.ts` - MongoDB Fastify plugin
- `src/models/tracked-shipment.model.ts` - Mongoose model
- `src/services/tracking-database.service.ts` - Database service
- `src/services/tracking-cron.service.ts` - Cron job service
- `test-tracking-storage.ts` - Comprehensive test script

### Modified Files:
- `src/app.ts` - Initialize cron job on startup
- `src/routes/tracking/index.ts` - Added 6 new routes
- `.env` - Added MongoDB configuration
- `.env.example` - Added MongoDB configuration template

## 🔧 Configuration

### Environment Variables (.env)

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=e-tracking
```

### MongoDB Schema

```typescript
{
  trackingNo: String (indexed, unique with service)
  service: 'purolator' | 'ups' | 'fedex' | 'dhl' | 'other'
  trackingResponse: Mixed (full TrackingResponse object)
  lastUpdated: Date (indexed)
  isActive: Boolean (indexed)
  errorCount: Number
  lastError: String
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

## 🚀 Usage Examples

### 1. Track and Store a Shipment

```bash
curl -X POST http://localhost:3000/tracking/purolator/335702383951
```

Response:
```json
{
  "success": true,
  "message": "Shipment is now being tracked",
  "data": {
    "trackingNo": "335702383951",
    "service": "purolator",
    "isActive": true,
    "lastUpdated": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "trackingResponse": { ... }
  }
}
```

### 2. Get Stored Tracking Status

```bash
curl http://localhost:3000/tracking/purolator/335702383951/status
```

### 3. Get Tracking Statistics

```bash
curl http://localhost:3000/tracking/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "total": 5,
    "active": 4,
    "inactive": 1,
    "byService": {
      "purolator": 5
    }
  }
}
```

### 4. Manually Trigger Cron Update

```bash
curl -X POST http://localhost:3000/tracking/cron/trigger
```

### 5. Stop Tracking a Shipment

```bash
curl -X DELETE http://localhost:3000/tracking/purolator/335702383951
```

## 🔄 Cron Job Behavior

1. **Automatic Start**: Cron job starts automatically when the application starts
2. **Schedule**: Runs every 15 minutes
3. **Initial Run**: Runs immediately on startup
4. **Update Logic**:
   - Fetches all active shipments not updated in 15+ minutes
   - Updates each shipment via Purolator API
   - Records errors and deactivates after 10 consecutive failures
   - Adds 500ms delay between API calls
5. **Graceful Shutdown**: Stops when application closes

## 📊 Error Handling

- **API Errors**: Recorded in `lastError` field, `errorCount` incremented
- **10 Consecutive Errors**: Shipment automatically deactivated
- **Concurrent Updates**: Skips update if previous update still running
- **Database Errors**: Logged and thrown for proper error handling

## 🧪 Testing

### Prerequisites
1. Start MongoDB: `mongod` (or use Docker)
2. Start the application: `npm run dev`

### Run Test Script

```bash
npx tsx test-tracking-storage.ts
```

The test script will:
1. ✅ Track and store a shipment (POST /tracking/purolator/:pin)
2. ✅ Get stored tracking status (GET /tracking/purolator/:pin/status)
3. ✅ Get tracking statistics (GET /tracking/stats)
4. ✅ Get cron job status (GET /tracking/cron/status)
5. ✅ Manually trigger cron job (POST /tracking/cron/trigger)
6. ✅ Delete tracked shipment (DELETE /tracking/purolator/:pin)

## 🎯 Next Steps

1. **Start MongoDB** (if not already running):
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Or install MongoDB locally
   ```

2. **Start the Application**:
   ```bash
   npm run dev
   ```

3. **Run Tests**:
   ```bash
   npx tsx test-tracking-storage.ts
   ```

4. **Monitor Cron Job**:
   - Check server logs for cron job execution
   - Look for: "🔄 Starting tracking update..."
   - Verify updates complete successfully

## 📝 Notes

- The cron job runs every 15 minutes automatically
- Shipments are only updated if they haven't been updated in 15+ minutes
- Failed shipments are automatically deactivated after 10 errors
- All tracking data is stored in MongoDB for historical reference
- The system supports multiple carriers (purolator, ups, fedex, dhl, other)
- Currently only Purolator tracking is implemented in the cron job

## 🔐 Security Considerations

- MongoDB connection should use authentication in production
- Consider rate limiting on the POST endpoint
- Add authentication/authorization for tracking management
- Validate tracking numbers before storing
- Consider data retention policies for old tracking data

---

**Status**: ✅ Implementation Complete - Ready for Testing

