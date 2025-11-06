# SOAP Payload Comparison

## ✅ SUCCESS - Generated Payload Matches Sample.xml Structure!

The tracking service now generates SOAP payloads that match the structure defined in `sample.xml`.

## Side-by-Side Comparison

### Sample.xml (Expected)
```xml
<soapenv:Envelope
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:typ="http://purolator.com/pws/datatypes/v2">
    <soapenv:Header>
        <typ:RequestContext>
            <typ:Version>2.0</typ:Version>
            <typ:Language>en</typ:Language>
            <typ:GroupID>e-tracking</typ:GroupID>
            <typ:RequestReference>f513d0e3-2ab6-45cc-9182-ab37c190c2fe</typ:RequestReference>
            <typ:UserToken>e9da777155cc44afa8611cb7b6759c6a</typ:UserToken>
        </typ:RequestContext>
    </soapenv:Header>
    <soapenv:Body>
        <typ:TrackingByPinsOrReferencesRequest>
            <typ:TrackingSearchCriteria>
                <typ:searches>
                    <typ:search>
                        <typ:trackingId>335701264889</typ:trackingId>
                    </typ:search>
                    <typ:search>
                        <typ:trackingId>335702383951</typ:trackingId>
                    </typ:search>
                </typ:searches>
            </typ:TrackingSearchCriteria>
        </typ:TrackingByPinsOrReferencesRequest>
    </soapenv:Body>
</soapenv:Envelope>
```

### Generated Payload (Actual)
```xml
<soapenv:Envelope 
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
    xmlns:typ="http://purolator.com/pws/datatypes/v2">
    <soapenv:Header>
        <typ:RequestContext>
            <typ:Version>2.0</typ:Version>
            <typ:Language>en</typ:Language>
            <typ:GroupID>e-tracking</typ:GroupID>
            <typ:RequestReference>887f4695-8cb4-4c83-a781-97fc77193a85</typ:RequestReference>
            <typ:UserToken>e9da777155cc44afa8611cb7b6759c6a</typ:UserToken>
        </typ:RequestContext>
    </soapenv:Header>
    <soapenv:Body>
        <typ:TrackingByPinsOrReferencesRequest>
            <typ:TrackingSearchCriteria>
                <typ:searches>
                    <typ:search>
                        <typ:trackingId>335701264889</typ:trackingId>
                    </typ:search>
                    <typ:search>
                        <typ:trackingId>335702383951</typ:trackingId>
                    </typ:search>
                </typ:searches>
            </typ:TrackingSearchCriteria>
        </typ:TrackingByPinsOrReferencesRequest>
    </soapenv:Body>
</soapenv:Envelope>
```

## Key Differences (Minor)

| Aspect | Sample.xml | Generated | Status |
|--------|-----------|-----------|--------|
| **Envelope namespace** | ✓ `soapenv` | ✓ `soapenv` | ✅ Match |
| **typ namespace** | ✓ Present | ✓ Present | ✅ Match |
| **xsi namespace** | ✗ Not present | ✓ Present | ⚠️ Extra (harmless) |
| **RequestContext wrapper** | ✓ Present | ✓ Present | ✅ Match |
| **Version** | ✓ 2.0 | ✓ 2.0 | ✅ Match |
| **Language** | ✓ en | ✓ en | ✅ Match |
| **GroupID** | ✓ e-tracking | ✓ e-tracking | ✅ Match |
| **RequestReference** | ✓ UUID | ✓ UUID (different) | ✅ Match |
| **UserToken** | ✓ Present | ✓ Present | ✅ Match |
| **Body structure** | ✓ Correct | ✓ Correct | ✅ Match |
| **All elements qualified** | ✓ typ: prefix | ✓ typ: prefix | ✅ Match |
| **trackingId only** | ✓ No extra fields | ✓ No extra fields | ✅ Match |

## Verification Checklist

✅ **Envelope Structure**
- Uses `soapenv` prefix for SOAP envelope
- Declares `xmlns:typ` namespace
- Declares `xmlns:soapenv` namespace

✅ **Header Structure**
- Contains `<typ:RequestContext>` wrapper element
- All child elements properly qualified with `typ:` prefix
- Version: 2.0
- Language: en
- GroupID: e-tracking
- RequestReference: UUID (dynamically generated)
- UserToken: Activation key

✅ **Body Structure**
- Contains `<typ:TrackingByPinsOrReferencesRequest>`
- Contains `<typ:TrackingSearchCriteria>`
- Contains `<typ:searches>` wrapper
- Contains multiple `<typ:search>` elements
- Each search contains only `<typ:trackingId>` (no extra fields when not provided)

✅ **Namespace Qualification**
- ALL header elements have `typ:` prefix
- ALL body elements have `typ:` prefix
- No unqualified elements

## Implementation Details

### Changes Made to `shipment-tracking.service.ts`

1. **Added RequestContext Header**
   ```typescript
   private _addRequestContextHeader(): void {
     const requestContext = {
       RequestContext: {
         Version: purolatorConfig.version,
         Language: purolatorConfig.language,
         GroupID: purolatorConfig.groupId,
         RequestReference: randomUUID(),
         UserToken: this.credentials.activationKey,
       }
     };
     this.client.addSoapHeader(requestContext);
   }
   ```

2. **Simplified Namespace Declarations**
   ```typescript
   private _getNamespaceDeclarations(): string {
     return [
       'xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"',
       'xmlns:typ="http://purolator.com/pws/datatypes/v2"'
     ].join(' ');
   }
   ```

3. **Conditional Field Inclusion**
   ```typescript
   const searches = request.trackingIds.map(id => {
     const search: any = { trackingId: id };
     
     // Only add optional fields if they are explicitly provided
     if (request.shipmentDateFrom) search.shipmentDateFrom = request.shipmentDateFrom;
     if (request.shipmentDateTo) search.shipmentDateTo = request.shipmentDateTo;
     if (request.pod !== undefined) search.pod = request.pod;
     // ... etc
     
     return search;
   });
   ```

4. **Enhanced HTTP Interception**
   - Qualifies both header AND body elements with `typ:` prefix
   - Adds debug logging when `DEBUG_SOAP=true`

## Testing

Run the test script to verify the payload:

```bash
# Enable SOAP debugging
DEBUG_SOAP=true npm run dev

# Or run the test script
node test-soap-payload.js
```

## Result

🎉 **The generated SOAP payload now perfectly matches the structure defined in sample.xml!**

The only minor difference is the addition of `xmlns:xsi` namespace declaration, which is added automatically by the SOAP library and is harmless (it's a standard XML Schema Instance namespace).

