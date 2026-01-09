// 依存関係ゼロのYouTubeチャットビューアサーバー
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 3001;

// レスポンスを送信するヘルパー関数
const sendResponse = (res, statusCode, headers, body) => {
  res.writeHead(statusCode, headers);
  res.end(body);
};

// POSTリクエストのボディを解析する関数
const parseBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
};

// YouTubeへのHTTPSリクエストを行う関数
const fetchYouTube = (url, options = {}, postData = null) => {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (postData) {
            req.write(postData);
        }

        req.end();
    });
};

// メインのサーバーロジック
const server = http.createServer(async (req, res) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Pre-flightリクエストの処理
    if (req.method === 'OPTIONS') {
        sendResponse(res, 204, corsHeaders, null);
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);

    try {
        if (url.pathname === '/' && req.method === 'GET') {
            const filePath = path.join(__dirname, 'index.html');
            const stat = fs.statSync(filePath);
            sendResponse(res, 200, { 'Content-Type': 'text/html', 'Content-Length': stat.size }, fs.readFileSync(filePath));
        
        } else if (url.pathname === '/start-chat' && req.method === 'POST') {
            const { videoId } = await parseBody(req);
            if (!videoId) {
              return sendResponse(res, 400, { ...corsHeaders, 'Content-Type': 'application/json' }, JSON.stringify({ error: 'videoId is required' }));
            }

            const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const response = await fetchYouTube(ytUrl);
            const html = response.body;

            const match = html.match(/ytInitialData = ({.*?});/);
            if (!match || !match[1]) {
                return sendResponse(res, 500, { ...corsHeaders, 'Content-Type': 'application/json' }, JSON.stringify({ error: 'Could not find ytInitialData' }));
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
                return sendResponse(res, 500, { ...corsHeaders, 'Content-Type': 'application/json' }, JSON.stringify({ error: 'Could not find continuation token or API key' }));
            }
            const apiKey = apiKeyMatch[1];
            
            sendResponse(res, 200, { ...corsHeaders, 'Content-Type': 'application/json' }, JSON.stringify({ continuation, apiKey }));

        } else if (url.pathname === '/chat' && req.method === 'POST') {
            const { continuation, apiKey } = await parseBody(req);
            if (!continuation || !apiKey) {
                return sendResponse(res, 400, { ...corsHeaders, 'Content-Type': 'application/json' }, JSON.stringify({ error: 'continuation and apiKey are required' }));
            }

            const postData = JSON.stringify({
                context: { client: { clientName: 'WEB', clientVersion: '2.20210721.00.00' } },
                continuation,
            });

            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                },
            };

            const ytUrl = `https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?key=${apiKey}`;
            const response = await fetchYouTube(ytUrl, options, postData);
            sendResponse(res, response.statusCode, { ...corsHeaders, 'Content-Type': 'application/json' }, response.body);

        } else {
            sendResponse(res, 404, { 'Content-Type': 'text/plain' }, 'Not Found');
        }
    } catch (error) {
        console.error('Server Error:', error);
        sendResponse(res, 500, { ...corsHeaders, 'Content-Type': 'application/json' }, JSON.stringify({ error: 'Internal Server Error' }));
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('To use, open your browser and navigate to the URL above.');
});
