/**
 * Test script for UPS Tracking Service
 * 
 * Usage:
 *   npm run build:ts && node dist/test-ups-tracking.js
 * 
 * Make sure to set UPS_CLIENT_ID and UPS_CLIENT_SECRET in .env file
 */

import 'dotenv/config';
import { upsTrackingService } from './src/services/carriers/ups-tracking.service';

async function testUpsTracking() {
  console.log('🧪 Testing UPS Tracking Service\n');

  try {
    // Initialize the service
    console.log('1️⃣  Initializing UPS tracking service...');
    await upsTrackingService.initialize();
    console.log('✅ Service initialized\n');

    // Test tracking number (use a real UPS tracking number for testing)
    // Example: 1Z999AA10123456784 (this is a test tracking number from UPS documentation)
    const trackingNumber = process.argv[2] || '1Z999AA10123456784';
    
    console.log(`2️⃣  Tracking shipment: ${trackingNumber}`);
    console.log('   Please wait...\n');

    const result = await upsTrackingService.trackStandardized({
      trackingIds: [trackingNumber],
    });

    console.log('📦 Tracking Result:');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log(`Status: ${result.status}`);
    console.log(`Description: ${result.description}`);
    
    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      result.errors.forEach(err => console.log(`   - ${err}`));
    }

    console.log('\n📋 Shipment Details:');
    console.log(`   Status: ${result.shipment.status}`);
    console.log(`   Description: ${result.shipment.description}`);
    console.log(`   Created: ${result.shipment.createdDate.toISOString()}`);

    console.log('\n📍 Shipper:');
    console.log(`   City: ${result.shipment.shipper.city}`);
    console.log(`   State: ${result.shipment.shipper.proviceState}`);
    console.log(`   Country: ${result.shipment.shipper.countryCode}`);
    console.log(`   Postal Code: ${result.shipment.shipper.postalZipCode}`);

    console.log('\n📍 Receiver:');
    console.log(`   City: ${result.shipment.receiver.city}`);
    console.log(`   State: ${result.shipment.receiver.proviceState}`);
    console.log(`   Country: ${result.shipment.receiver.countryCode}`);
    console.log(`   Postal Code: ${result.shipment.receiver.postalZipCode}`);

    console.log('\n📦 Packages:');
    result.shipment.packages.forEach((pkg, index) => {
      console.log(`\n   Package ${index + 1}:`);
      console.log(`   Tracking #: ${pkg.pin}`);
      console.log(`   Status: ${pkg.status}`);
      console.log(`   Description: ${pkg.description}`);
      
      if (pkg.lastEvent) {
        console.log(`\n   Last Event:`);
        console.log(`   Date/Time: ${pkg.lastEvent.dateTime.toISOString()}`);
        console.log(`   Code: ${pkg.lastEvent.code}`);
        console.log(`   Description: ${pkg.lastEvent.description}`);
        console.log(`   Location: ${pkg.lastEvent.location.city}, ${pkg.lastEvent.location.proviceState} ${pkg.lastEvent.location.postalZipCode}`);
      }
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('\n✅ Test completed successfully!\n');

    // Display full JSON response
    console.log('📄 Full JSON Response:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testUpsTracking();

