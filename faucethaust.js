const axios = require('axios');
const fs = require('fs');

// Load wallet addresses & proxies
const addresses = fs.readFileSync('listaddress.txt', 'utf-8').split('\n').filter(Boolean);
const proxies = fs.readFileSync('proxy.txt', 'utf-8').split('\n').filter(Boolean);

// Base API endpoint
const API_URL = 'https://faucet.haust.app/api/claim';

// Function to get a random User-Agent
function getRandomUserAgent() {
    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Function to parse proxy string into axios format
function parseProxy(proxy) {
    if (!proxy) return null;
    const parts = proxy.split(':');
    if (parts.length === 2) {
        return { host: parts[0], port: parseInt(parts[1]) };
    } else if (parts.length === 4) {
        return {
            host: parts[0],
            port: parseInt(parts[1]),
            auth: { username: parts[2], password: parts[3] }
        };
    }
    return null;
}

// Function to claim faucet for a single address using assigned proxy
async function claimFaucet(address, proxy) {
    let attempts = 0;
    const maxRetries = 2; // Hanya mencoba 2 kali

    while (attempts < maxRetries) {
        try {
            console.log(`Attempting to claim for: ${address} (Attempt ${attempts + 1}/${maxRetries}) using proxy: ${proxy}`);

            const agent = proxy ? { proxy: parseProxy(proxy) } : {};

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

        if (attempts < maxRetries - 1) {
            console.log('Rate limit hit. Waiting 30 seconds before retrying...');
            await new Promise(resolve => setTimeout(resolve, 30000)); // Tunggu 30 detik sebelum mencoba lagi
        }

        attempts++;
    }

    console.log(`Failed to claim for ${address} after ${maxRetries} attempts.`);
}

// Main function to process all addresses
async function main() {
    console.log('Starting auto claim script...');
    
    while (true) {
        for (let i = 0; i < addresses.length; i++) {
            const address = addresses[i];
            const proxy = proxies[i % proxies.length]; // Ambil proxy sesuai urutan, ulangi jika habis
            await claimFaucet(address, proxy);

            console.log('Waiting 15 seconds before processing the next address...');
            await new Promise(resolve => setTimeout(resolve, 15000));
        }
    }
}

main();
