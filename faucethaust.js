const axios = require('axios');
const fs = require('fs');

// Load wallet addresses
const addresses = fs.readFileSync('listaddress.txt', 'utf-8').split('\n').filter(Boolean);

// Load proxy list
const proxies = fs.readFileSync('proxy.txt', 'utf-8').split('\n').filter(Boolean);

// Base API endpoint
const API_URL = 'https://faucet.haust.app/api/claim';

// Function to get a random proxy
function getRandomProxy() {
    if (proxies.length === 0) return null;
    const proxy = proxies[Math.floor(Math.random() * proxies.length)];
    return proxy.startsWith('http') ? proxy : `http://${proxy}`;
}

// Function to get random User-Agent
function getRandomUserAgent() {
    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Function to claim faucet for a single address using a proxy
async function claimFaucet(address) {
    const maxRetries = 2; // Ubah menjadi 2 kali percobaan
    let attempts = 0;

    while (attempts < maxRetries) {
        try {
            const proxy = getRandomProxy();
            console.log(`Using proxy: ${proxy}`);

            const agent = proxy
                ? {
                    proxy: {
                        host: proxy.split('@').pop().split(':')[0],
                        port: proxy.split('@').pop().split(':')[1],
                        auth: proxy.includes('@') ? {
                            username: proxy.split('@')[0].split(':')[0],
                            password: proxy.split('@')[0].split(':')[1]
                        } : undefined
                    }
                }
                : {};

            console.log(`Attempting to claim for: ${address} (Attempt ${attempts + 1}/${maxRetries})`);
            const response = await axios.post(API_URL, { address }, {
                ...agent,
                headers: {
                    'User-Agent': getRandomUserAgent(),
                    'Accept': 'application/json',
                    'Referer': 'https://faucet.haust.app',
                }
            });

            console.log(`Address: ${address} | Status: ${response.data.message}`);

            if (response.data.message && response.data.message.includes('success')) {
                console.log(`Claim successful for ${address}!`);
                return;
            }
        } catch (error) {
            console.error(`Address: ${address} | Error: ${error.response?.data?.message || error.message}`);
        }

        console.log('Rate limit hit. Waiting 30 seconds before retrying...');
        await new Promise(resolve => setTimeout(resolve, 30000)); // Tunggu 30 detik sebelum mencoba lagi
        attempts++;
    }

    console.log(`Failed to claim for ${address} after ${maxRetries} attempts.`);
}

// Main function to process all addresses
async function main() {
    console.log('Starting auto claim script...');
    while (true) {
        for (const address of addresses) {
            await claimFaucet(address);
            console.log('Waiting 15 seconds before processing the next address...');
            await new Promise(resolve => setTimeout(resolve, 15000));
        }
    }
}

main();
