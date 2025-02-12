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

// Function to claim faucet for a single address using a proxy
async function claimFaucet(address) {
    const maxRetries = 5; // Maximum attempts per address
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
            const response = await axios.post(API_URL, { address }, agent);

            // Log the status message
            console.log(`Address: ${address} | Status: ${response.data.message}`);

            // Check if claim was successful
            if (response.data.message && response.data.message.includes('success')) {
                console.log(`Claim successful for ${address}!`);
                return; // Exit function on success
            }
        } catch (error) {
            console.error(`Address: ${address} | Error: ${error.response?.data?.message || error.message}`);
        }

        // Wait for 5 seconds before retrying
        console.log('Retrying...');
        await new Promise(resolve => setTimeout(resolve, 5000));
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
            // Optional: Wait before processing the next address
            console.log('Waiting 10 seconds before processing the next address...');
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }
}

main();
