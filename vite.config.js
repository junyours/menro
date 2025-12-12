import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import os from 'os';

// Auto-detect your LAN IP
const networkInterfaces = os.networkInterfaces();
let localIP = 'localhost';
for (let interfaceKey in networkInterfaces) {
    for (let details of networkInterfaces[interfaceKey]) {
        if (details.family === 'IPv4' && !details.internal) {
            localIP = details.address;
        }
    }
}

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    server: {
        host: '0.0.0.0', // listen on all interfaces
        port: 5173,
        hmr: {
            host: localIP, // auto-uses your LAN IP for mobile HMR
        },
    },


      build: {
        outDir: 'public/build', // ✅ ensures manifest.json is in /public/build
        manifest: true,
        emptyOutDir: true,
    },
});
