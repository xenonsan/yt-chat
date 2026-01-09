const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

const router = express.Router();

// Main API logic
const findContinuation = (obj) => {
    if (obj && typeof obj === 'object') {
        if (obj.reloadContinuationData && obj.reloadContinuationData.continuation) return obj.reloadContinuationData.continuation;
        for (const key in obj) {
            const result = findContinuation(obj[key]);
            if (result) return result;
        }
    }
    return null;
};

router.post('/start-chat', async (req, res) => {
    const { videoId } = req.body;
    if (!videoId) {
        return res.status(400).json({ error: 'videoId is required' });
    }

    try {
        const ytResponse = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: { 'Accept-Language': 'en-US,en;q=0.5' } // Request English page to ensure data structure is consistent
        });
        const html = ytResponse.data;

        const match = html.match(/ytInitialData = ({.*?});/);
        if (!match || !match[1]) {
            return res.status(500).json({ error: 'Could not find ytInitialData' });
        }
        const ytInitialData = JSON.parse(match[1]);

        const continuation = findContinuation(ytInitialData);
        const apiKeyMatch = html.match(/"apiKey":"(.*?)"/);

        if (!continuation || !apiKeyMatch || !apiKeyMatch[1]) {
            return res.status(500).json({ error: 'Could not find continuation token or API key' });
        }
        const apiKey = apiKeyMatch[1];

        res.json({ continuation, apiKey });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch initial YouTube data.' });
    }
});

router.post('/chat', async (req, res) => {
    const { continuation, apiKey } = req.body;
    if (!continuation || !apiKey) {
        return res.status(400).json({ error: 'continuation and apiKey are required' });
    }

    try {
        const ytResponse = await axios.post(`https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?key=${apiKey}`, {
            context: { client: { clientName: 'WEB', clientVersion: '2.20210721.00.00' } },
            continuation,
        });
        res.json(ytResponse.data);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch chat data.' });
    }
});

// Use the router for all /api requests
app.use('/api', router);

// This is the main export for Vercel
module.exports = app;
