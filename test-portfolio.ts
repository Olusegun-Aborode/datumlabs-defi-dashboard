import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { getAddressPortfolio } from 'navi-sdk';

async function main() {
    const client = new SuiClient({ url: getFullnodeUrl('mainnet') });
    const address = '0x82772dd67e7e195ced6a4e3ee4158b757c0e10d37d998d035808394f52effc0e';
    console.log(`Fetching portfolio for ${address}...`);
    try {
        const portfolio = await getAddressPortfolio(address, false, client as any);
        console.log("Entries:", Array.from(portfolio.entries()));
    } catch (e) {
        console.error("Error", e);
    }
}

main();
