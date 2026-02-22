import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';

async function main() {
    const client = new SuiClient({ url: getFullnodeUrl('mainnet') });
    console.log(`Fetching 1 liquidation event to check parsing...`);
    try {
        const page = await client.queryEvents({
            query: { MoveEventType: '0x1e4a13a0494d5facdbe8473e74127b838c2d446ecec0ce262e2eddafa77259cb::event::LiquidationEvent' },
            limit: 1,
            order: "descending"
        });
        console.log("Raw Event:", JSON.stringify(page.data[0].parsedJson, null, 2));
    } catch (e) {
        console.error("Error", e);
    }
}

main();
