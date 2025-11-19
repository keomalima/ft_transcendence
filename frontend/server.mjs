// server.mjs
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = 5173;

// Racines servies: public d'abord, puis dist pour les .js
const roots = [
    join(__dirname, '.'),
    join(__dirname, 'dist')
];

const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
};

function contentType(path) {
    return mime[extname(path)] || 'application/octet-stream';
}

const server = http.createServer(async (req, res) => {
    try {
        let urlPath = req.url || '/';
        // Normalisation et protection basique
        urlPath = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');

        // Par défaut, servez l’index depuis public/
        if (urlPath === '/' || urlPath.endsWith('/')) {
            urlPath = join(urlPath, 'index.html');
        }

        // Résolution sur roots
        let foundPath = null;
        for (const root of roots) {
            const candidate = join(root, urlPath);
            try {
                const st = await stat(candidate);
                if (st.isFile()) {
                    foundPath = candidate;
                    break;
                }
            } catch (_) {}
        }

        if (!foundPath) {
            // For SPA: if no file found, serve index.html (let client-side router handle it)
            const indexPath = join(__dirname, 'index.html');
            try {
                await stat(indexPath);
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                createReadStream(indexPath).pipe(res);
                return;
            } catch (_) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Not Found');
                return;
            }
        }

        res.writeHead(200, { 'Content-Type': contentType(foundPath) });
        createReadStream(foundPath).pipe(res);
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Internal Server Error\n' + (err?.message || String(err)));
    }
});

server.listen(PORT, () => {
    console.log(`Dev server running at http://localhost:${PORT}`);
});

// Graceful shutdown handlers
const shutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
    
    // Force exit after 5 seconds if server doesn't close
    setTimeout(() => {
        console.error('⚠️  Forcing shutdown...');
        process.exit(1);
    }, 5000);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
