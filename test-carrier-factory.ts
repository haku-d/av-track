/**
 * Test script to verify the carrier factory refactoring
 */

import { 
  getTrackingService, 
  isCarrierSupported, 
  getSupportedCarriers,
  trackingServiceRegistry 
} from './src/services/carriers/tracking-service-factory';

async function testCarrierFactory() {
  console.log('🧪 Testing Carrier Factory Refactoring\n');

  // Test 1: Get supported carriers
  console.log('1️⃣ Testing getSupportedCarriers()');
  const supportedCarriers = getSupportedCarriers();
  console.log(`   ✅ Supported carriers: ${supportedCarriers.join(', ')}\n`);

  // Test 2: Check if carriers are supported
  console.log('2️⃣ Testing isCarrierSupported()');
  console.log(`   Purolator supported: ${isCarrierSupported('purolator')} ✅`);
  console.log(`   UPS supported: ${isCarrierSupported('ups')} (expected: false)`);
  console.log(`   Stampede supported: ${isCarrierSupported('stampede')} (expected: false)\n`);

  // Test 3: Get Purolator service
  console.log('3️⃣ Testing getTrackingService("purolator")');
  try {
    const purolatorService = getTrackingService('purolator');
    console.log(`   ✅ Got service: ${purolatorService.getCarrierName()}`);
    console.log(`   Service ready: ${purolatorService.isReady()}`);
    
    // Initialize the service
    console.log('   Initializing service...');
    await purolatorService.initialize();
    console.log(`   ✅ Service initialized: ${purolatorService.isReady()}\n`);
  } catch (error) {
    console.error(`   ❌ Error: ${error}\n`);
  }

  // Test 4: Try to get unsupported carrier
  console.log('4️⃣ Testing getTrackingService("ups") - should throw error');
  try {
    const upsService = getTrackingService('ups' as any);
    console.log(`   ❌ Should have thrown error but got: ${upsService}\n`);
  } catch (error) {
    console.log(`   ✅ Correctly threw error: ${error instanceof Error ? error.message : error}\n`);
  }

  // Test 5: Test backward compatibility
  console.log('5️⃣ Testing backward compatibility (shipmentTrackingService)');
  try {
    const { shipmentTrackingService } = await import('./src/services/shipment-tracking.service');
    console.log(`   ✅ Imported shipmentTrackingService`);
    console.log(`   Carrier name: ${shipmentTrackingService.getCarrierName()}`);
    console.log(`   Service ready: ${shipmentTrackingService.isReady()}\n`);
  } catch (error) {
    console.error(`   ❌ Error: ${error}\n`);
  }

  // Test 6: Test registry
  console.log('6️⃣ Testing trackingServiceRegistry');
  const allServices = trackingServiceRegistry.getAllServices();
  console.log(`   Total registered services: ${allServices.size}`);
  for (const [carrier, service] of allServices) {
    console.log(`   - ${carrier}: ${service.getCarrierName()}`);
  }

  console.log('\n✅ All tests completed!');
}

// Run the tests
testCarrierFactory().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

