// server.js - Entrypoint for Node.js environments (local, Render, Vercel)
import { createServer } from 'node:http';
import { handleRequest } from './src/handler.js';

const PORT = process.env.PORT || 3000;

// This adapter function converts a Node.js IncomingMessage to a standard Request
function toStandardRequest(req, port) {
    const url = new URL(req.url, `http://${req.headers.host || `localhost:${port}`}`);
    
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) {
            value.forEach(v => headers.append(key, v));
        } else {
            headers.append(key, value);
        }
    }

    const body = ['GET', 'HEAD'].includes(req.method) ? null : req;

    return new Request(url, {
        method: req.method,
        headers,
        body,
        duplex: 'half' // Required for streaming request bodies in Node.js v20+
    });
}

// This adapter function applies a standard Response to a Node.js ServerResponse
async function applyStandardResponse(res, standardResponse) {
    res.statusCode = standardResponse.status;
    for (const [key, value] of standardResponse.headers.entries()) {
        res.setHeader(key, value);
    }
    if (standardResponse.body) {
        for await (const chunk of standardResponse.body) {
            res.write(chunk);
        }
    }
    res.end();
}

const server = createServer(async (req, res) => {
    try {
        const request = toStandardRequest(req, PORT);
        const response = await handleRequest(request);
        await applyStandardResponse(res, response);
    } catch (e) {
        console.error(e);
        res.statusCode = 500;
        res.end('Internal Server Error');
    }
});

server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});

// Vercel exports the server instance
export default server;
