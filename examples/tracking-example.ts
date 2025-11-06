/**
 * Example usage of the Shipment Tracking Service
 * 
 * This file demonstrates how to use the tracking service programmatically.
 * Make sure to set up your .env file with proper credentials before running.
 */

import 'dotenv/config';
import { shipmentTrackingService } from '../src/services/shipment-tracking.service';

async function main() {
  console.log('=== Purolator Shipment Tracking Example ===\n');

  try {
    // Example 1: Track a single shipment by PIN
    console.log('1. Tracking single shipment by PIN...');
    const singleResult = await shipmentTrackingService.trackByPin('329012345678', {
      pod: true,
      shipmentView: true,
    });
    
    console.log('Result:', JSON.stringify(singleResult, null, 2));
    console.log('\n---\n');

    // Example 2: Track multiple shipments
    console.log('2. Tracking multiple shipments...');
    const multipleResult = await shipmentTrackingService.trackByPins(
      ['329012345678', '329012345679'],
      {
        shipmentView: true,
      }
    );
    
    console.log('Result:', JSON.stringify(multipleResult, null, 2));
    console.log('\n---\n');

    // Example 3: Track with date range
    console.log('3. Tracking with date range...');
    const dateRangeResult = await shipmentTrackingService.track({
      trackingIds: ['329012345678'],
      shipmentDateFrom: '2024-01-01',
      shipmentDateTo: '2024-12-31',
      pod: true,
    });
    
    console.log('Result:', JSON.stringify(dateRangeResult, null, 2));
    console.log('\n---\n');

    // Example 4: Get service description
    console.log('4. Getting service description...');
    const description = await shipmentTrackingService.describe();
    console.log('Service methods:', Object.keys(description.ShipmentTrackingService.ShipmentTrackingServiceEndpoint));
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  } finally {
    // Clean up
    shipmentTrackingService.close();
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { main };

