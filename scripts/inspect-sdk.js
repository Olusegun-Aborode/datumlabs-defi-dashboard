const { getPools } = require('@naviprotocol/lending');

async function main() {
    console.log('Fetching pools via functional SDK...');
    try {
        const pools = await getPools();
        const keys = Object.keys(pools);
        console.log(`Found ${keys.length} pools.`);
        console.log('Keys:', keys);
        if (keys.length > 0) {
            console.log('Sample Pool (Sui):', JSON.stringify(pools['Sui'] || pools[keys[0]], null, 2));
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
