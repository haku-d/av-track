/**
 * Example usage of Purolator Shipping Service
 * This demonstrates how to create, validate, and void shipments
 */

import { purolatorShippingService } from '../src/services/carriers/purolator-shipping.service';
import { ShippingRequest } from '../src/types/shipping.types';

// Example shipment data
const exampleShipment: ShippingRequest = {
  shipment: {
    SenderInformation: {
      Address: {
        Name: 'John Sender',
        Company: 'Sender Company Inc.',
        StreetNumber: '123',
        StreetName: 'Main Street',
        StreetType: 'St',
        City: 'Toronto',
        Province: 'ON',
        Country: 'CA',
        PostalCode: 'M5V 3A8',
        PhoneNumber: {
          CountryCode: '1',
          AreaCode: '416',
          Phone: '5551234'
        }
      }
    },
    ReceiverInformation: {
      Address: {
        Name: 'Jane Receiver',
        Company: 'Receiver Corp',
        StreetNumber: '456',
        StreetName: 'Oak Avenue',
        StreetType: 'Ave',
        City: 'Vancouver',
        Province: 'BC',
        Country: 'CA',
        PostalCode: 'V6B 1A1',
        PhoneNumber: {
          CountryCode: '1',
          AreaCode: '604',
          Phone: '5555678'
        }
      }
    },
    PackageInformation: {
      ServiceID: 'PurolatorExpress',
      Description: 'Sample package',
      TotalWeight: {
        Value: 2.5,
        WeightUnit: 'kg'
      },
      TotalPieces: 1
    },
    PaymentInformation: {
      PaymentType: 'Sender',
      RegisteredAccountNumber: 'YOUR_ACCOUNT_NUMBER'
    },
    PickupInformation: {
      PickupType: 'DropOff'
    },
    ShipmentDate: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
  },
  printerType: 'Regular'
};

async function demonstrateShippingService() {
  try {
    console.log('=== Purolator Shipping Service Demo ===\n');

    // Initialize the service
    console.log('1. Initializing shipping service...');
    await purolatorShippingService.initialize();
    console.log('✓ Service initialized successfully\n');

    // Validate shipment first
    console.log('2. Validating shipment data...');
    const validationResult = await purolatorShippingService.validateShipment(exampleShipment);
    
    if (validationResult.success && validationResult.isValid) {
      console.log('✓ Shipment data is valid\n');
    } else {
      console.log('✗ Shipment validation failed:');
      validationResult.errors?.forEach(error => {
        console.log(`  - ${error.Description}`);
      });
      return;
    }

    // Create shipment
    console.log('3. Creating shipment...');
    const createResult = await purolatorShippingService.createShipment(exampleShipment);
    
    if (createResult.success) {
      console.log('✓ Shipment created successfully!');
      console.log(`  Shipment PIN: ${createResult.shipmentPIN}`);
      
      if (createResult.piecePINs && createResult.piecePINs.length > 0) {
        console.log(`  Piece PINs: ${createResult.piecePINs.join(', ')}`);
      }
      
      if (createResult.messages && createResult.messages.length > 0) {
        console.log('  Messages:');
        createResult.messages.forEach(msg => {
          console.log(`    - ${msg.Message}`);
        });
      }
      
      // Demonstrate voiding the shipment
      if (createResult.shipmentPIN) {
        console.log('\n4. Voiding the shipment...');
        const voidResult = await purolatorShippingService.voidShipment({
          pin: createResult.shipmentPIN
        });
        
        if (voidResult.success) {
          console.log('✓ Shipment voided successfully');
        } else {
          console.log('✗ Failed to void shipment:');
          voidResult.errors?.forEach(error => {
            console.log(`  - ${error.Description}`);
          });
        }
      }
    } else {
      console.log('✗ Failed to create shipment:');
      createResult.errors?.forEach(error => {
        console.log(`  - ${error.Description}`);
      });
    }

  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateShippingService()
    .then(() => {
      console.log('\n=== Demo completed ===');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Demo error:', error);
      process.exit(1);
    });
}

export { demonstrateShippingService, exampleShipment };
