/**
 * Test script for tracking storage and cron job functionality
 * 
 * This script tests:
 * 1. POST /tracking/purolator/:pin - Track and store a shipment
 * 2. GET /tracking/purolator/:pin/status - Get stored tracking status
 * 3. GET /tracking/stats - Get tracking statistics
 * 4. POST /tracking/cron/trigger - Manually trigger cron job
 * 5. GET /tracking/cron/status - Get cron job status
 * 6. DELETE /tracking/purolator/:pin - Stop tracking a shipment
 */

import 'dotenv/config';

const BASE_URL = 'http://localhost:3000/tracking';
const TEST_PIN = '335702383951'; // Known working PIN

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

/**
 * Helper function to make HTTP requests
 */
async function makeRequest(
  method: string,
  url: string,
  body?: any
): Promise<any> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();
  
  return {
    status: response.status,
    data,
  };
}

/**
 * Test 1: Track and store a shipment
 */
async function testTrackAndStore() {
  console.log('\n📦 Test 1: POST /tracking/purolator/:pin - Track and store shipment');
  console.log('='.repeat(70));
  
  try {
    const response = await makeRequest('POST', `${BASE_URL}/purolator/${TEST_PIN}`);
    
    if (response.status === 201 && response.data.success) {
      console.log('✅ SUCCESS - Shipment tracked and stored');
      console.log('   Tracking No:', response.data.data.trackingNo);
      console.log('   Service:', response.data.data.service);
      console.log('   Active:', response.data.data.isActive);
      console.log('   Last Updated:', response.data.data.lastUpdated);
      console.log('   Shipment Status:', response.data.data.trackingResponse.shipment?.status);
      
      results.push({
        name: 'Track and Store',
        success: true,
        data: response.data,
      });
    } else {
      throw new Error(`Unexpected response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.log('❌ FAILED:', error instanceof Error ? error.message : error);
    results.push({
      name: 'Track and Store',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Test 2: Get stored tracking status
 */
async function testGetStoredStatus() {
  console.log('\n📊 Test 2: GET /tracking/purolator/:pin/status - Get stored status');
  console.log('='.repeat(70));
  
  try {
    const response = await makeRequest('GET', `${BASE_URL}/purolator/${TEST_PIN}/status`);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ SUCCESS - Retrieved stored tracking data');
      console.log('   Tracking No:', response.data.data.trackingNo);
      console.log('   Service:', response.data.data.service);
      console.log('   Active:', response.data.data.isActive);
      console.log('   Last Updated:', response.data.data.lastUpdated);
      console.log('   Error Count:', response.data.data.errorCount);
      
      results.push({
        name: 'Get Stored Status',
        success: true,
        data: response.data,
      });
    } else {
      throw new Error(`Unexpected response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.log('❌ FAILED:', error instanceof Error ? error.message : error);
    results.push({
      name: 'Get Stored Status',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Test 3: Get tracking statistics
 */
async function testGetStatistics() {
  console.log('\n📈 Test 3: GET /tracking/stats - Get tracking statistics');
  console.log('='.repeat(70));
  
  try {
    const response = await makeRequest('GET', `${BASE_URL}/stats`);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ SUCCESS - Retrieved tracking statistics');
      console.log('   Total Shipments:', response.data.data.total);
      console.log('   Active Shipments:', response.data.data.active);
      console.log('   Inactive Shipments:', response.data.data.inactive);
      console.log('   By Service:', JSON.stringify(response.data.data.byService, null, 2));
      
      results.push({
        name: 'Get Statistics',
        success: true,
        data: response.data,
      });
    } else {
      throw new Error(`Unexpected response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.log('❌ FAILED:', error instanceof Error ? error.message : error);
    results.push({
      name: 'Get Statistics',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Test 4: Get cron job status
 */
async function testGetCronStatus() {
  console.log('\n⏰ Test 4: GET /tracking/cron/status - Get cron job status');
  console.log('='.repeat(70));
  
  try {
    const response = await makeRequest('GET', `${BASE_URL}/cron/status`);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ SUCCESS - Retrieved cron job status');
      console.log('   Running:', response.data.data.running);
      console.log('   Updating:', response.data.data.updating);
      
      results.push({
        name: 'Get Cron Status',
        success: true,
        data: response.data,
      });
    } else {
      throw new Error(`Unexpected response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.log('❌ FAILED:', error instanceof Error ? error.message : error);
    results.push({
      name: 'Get Cron Status',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Test 5: Manually trigger cron job
 */
async function testTriggerCron() {
  console.log('\n🔄 Test 5: POST /tracking/cron/trigger - Manually trigger cron job');
  console.log('='.repeat(70));
  
  try {
    const response = await makeRequest('POST', `${BASE_URL}/cron/trigger`);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ SUCCESS - Cron job triggered');
      console.log('   Message:', response.data.message);
      
      // Wait a bit for the update to complete
      console.log('   Waiting 5 seconds for update to complete...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      results.push({
        name: 'Trigger Cron',
        success: true,
        data: response.data,
      });
    } else {
      throw new Error(`Unexpected response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.log('❌ FAILED:', error instanceof Error ? error.message : error);
    results.push({
      name: 'Trigger Cron',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Test 6: Delete tracked shipment
 */
async function testDeleteTracking() {
  console.log('\n🗑️  Test 6: DELETE /tracking/purolator/:pin - Stop tracking shipment');
  console.log('='.repeat(70));
  
  try {
    const response = await makeRequest('DELETE', `${BASE_URL}/purolator/${TEST_PIN}`);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ SUCCESS - Shipment tracking stopped');
      console.log('   Message:', response.data.message);
      
      results.push({
        name: 'Delete Tracking',
        success: true,
        data: response.data,
      });
    } else {
      throw new Error(`Unexpected response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.log('❌ FAILED:', error instanceof Error ? error.message : error);
    results.push({
      name: 'Delete Tracking',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Print summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(70));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(70));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(70));
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting Tracking Storage Tests');
  console.log('📍 Base URL:', BASE_URL);
  console.log('📦 Test PIN:', TEST_PIN);
  console.log('\n⚠️  Make sure:');
  console.log('   1. The server is running (npm run dev)');
  console.log('   2. MongoDB is running on localhost:27017');
  
  try {
    await testTrackAndStore();
    await testGetStoredStatus();
    await testGetStatistics();
    await testGetCronStatus();
    await testTriggerCron();
    await testDeleteTracking();
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  } finally {
    printSummary();
  }
}

// Run the tests
runTests().catch(console.error);

