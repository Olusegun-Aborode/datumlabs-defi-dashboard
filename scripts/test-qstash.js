const url = 'https://datumlabs.xyz/navi/api/cron/collect-pools';
const token = 'eyJVc2VySUQiOiI1NTU2YmU1MS1kNmQ4LTQ4ODItYjNmNC1hMzI4OGI3Y2UwODgiLCJQYXNzd29yZCI6ImUzYTRmZjg3Njg1YzRlZTA5MzY4NTE2Mzc2MDI5NmI4In0=';

async function test() {
    console.log(`Testing with exact url string: "${url}"`);
    const res = await fetch('https://qstash-eu-central-1.upstash.io/v2/schedules', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Upstash-Forward-Authorization': `Bearer abebf2390231920`,
        },
        body: JSON.stringify({
            destination: url,
            cron: '*/5 * * * *',
        }),
    });

    const text = await res.text();
    console.log(text);
}

test();
