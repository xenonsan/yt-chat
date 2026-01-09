// functions/api/[[path]].js

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Main function for all requests to /api/*
export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);

    // Handle CORS pre-flight requests
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }
    
    // Simple router based on path
    const path = url.pathname.replace('/api/', '');

    try {
        if (path === 'start-chat' && request.method === 'POST') {
            return await handleStartChat(request);
        }
        if (path === 'chat' && request.method === 'POST') {
            return await handleChat(request);
        }
        return new Response('Not Found', { status: 404 });
        
    } catch (e) {
        console.error('API Error:', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error', message: e.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}

// Handler for the /api/start-chat endpoint
async function handleStartChat(request) {
    const { videoId } = await request.json();
    if (!videoId) {
        return new Response(JSON.stringify({ error: 'videoId is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const ytResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await ytResponse.text();

    const match = html.match(/ytInitialData = ({.*?});/);
    if (!match || !match[1]) {
        return new Response(JSON.stringify({ error: 'Could not find ytInitialData' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    const ytInitialData = JSON.parse(match[1]);

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
    const continuation = findContinuation(ytInitialData);

    const apiKeyMatch = html.match(/"apiKey":"(.*?)"/);
    if (!continuation || !apiKeyMatch || !apiKeyMatch[1]) {
        return new Response(JSON.stringify({ error: 'Could not find continuation token or API key' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    const apiKey = apiKeyMatch[1];

    return new Response(JSON.stringify({ continuation, apiKey }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

// Handler for the /api/chat endpoint
async function handleChat(request) {
    const { continuation, apiKey } = await request.json();
    if (!continuation || !apiKey) {
        return new Response(JSON.stringify({ error: 'continuation and apiKey are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const postData = {
        context: { client: { clientName: 'WEB', clientVersion: '2.20210721.00.00' } },
        continuation,
    };

    const ytResponse = await fetch(`https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
    });

    // We need to clone the response to be able to modify headers
    const newHeaders = new Headers(ytResponse.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
        newHeaders.set(key, value);
    }
    
    // Return the response from YouTube directly, but with our CORS headers
    return new Response(ytResponse.body, {
        status: ytResponse.status,
        statusText: ytResponse.statusText,
        headers: newHeaders,
    });
}
