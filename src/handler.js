const HTML_CONTENT = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YouTubeライブチャットビューア</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            font-family: 'Roboto', sans-serif;
            --yt-background-color: #181818;
            --yt-surface-color: #212121;
            --yt-text-primary-color: #ffffff;
            --yt-text-secondary-color: #aaaaaa;
            --yt-border-color: #383838;
            --yt-accent-color: #3ea6ff;
        }
        body {
            background-color: var(--yt-background-color);
            color: var(--yt-text-primary-color);
            margin: 0;
            overflow: hidden;
        }
        #app {
            width: 100%;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header {
            background-color: var(--yt-surface-color);
            padding: 1rem;
            border-bottom: 1px solid var(--yt-border-color);
        }
        .header h1 {
            font-size: 1.2em;
            margin: 0 0 0.8rem 0;
            font-weight: 500;
            text-align: left;
        }
        .url-form { display: flex; gap: 0.5rem; }
        .url-input {
            flex-grow: 1;
            padding: 0.5rem 1rem;
            border: 1px solid var(--yt-border-color);
            border-radius: 4px;
            font-size: 1em;
            background-color: var(--yt-background-color);
            color: var(--yt-text-primary-color);
            font-family: inherit;
        }
        .submit-button {
            padding: 0.5rem 1.5rem;
            border-radius: 4px;
            border: none;
            font-size: 1em;
            font-weight: 500;
            font-family: inherit;
            background-color: var(--yt-accent-color);
            color: #0f0f0f;
            cursor: pointer;
            transition: opacity 0.25s;
        }
        .submit-button:hover { opacity: 0.8; }
        .submit-button:disabled { opacity: 0.5; cursor: not-allowed; }

        .chat-container {
            flex-grow: 1;
            min-height: 0;
            overflow-y: auto;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .chat-container::-webkit-scrollbar { width: 8px; }
        .chat-container::-webkit-scrollbar-track { background: transparent; }
        .chat-container::-webkit-scrollbar-thumb { background: #555; border-radius: 4px; }
        .chat-container::-webkit-scrollbar-thumb:hover { background: #777; }

        .chat-message { display: flex; gap: 1rem; align-items: flex-start; line-height: 1.4; }
        .author-photo { width: 24px; height: 24px; border-radius: 50%; }
        .message-body { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 0.5rem; }
        .timestamp { font-size: 0.8em; color: var(--yt-text-secondary-color); }
        .author-name { font-weight: 500; color: var(--yt-text-secondary-color); }
        .message-text { color: var(--yt-text-primary-color); word-break: break-word; }
        
        .error-message { color: #ff8a80; background-color: rgba(255, 138, 128, 0.1); padding: 1rem; border-left: 3px solid #ff8a80; margin: 1rem; text-align: left; }

        @media (max-width: 768px) {
            .header { padding: 0.75rem; }
            .header h1 { display: none; }
            .chat-container { padding: 0.75rem; }
        }
    </style>
</head>
<body>
    <div id="app">
        <div class="header">
            <h1>YouTubeライブチャットビューア</h1>
            <form id="url-form" class="url-form">
                <input type="text" id="url-input" placeholder="例: https://www.youtube.com/watch?v=..." class="url-input"/>
                <button type="submit" id="submit-button" class="submit-button">チャット取得</button>
            </form>
        </div>
        <div id="error-message" class="error-message" style="display: none;"></div>
        <div id="chat-container" class="chat-container"></div>
    </div>

    <script>
        const API_BASE_URL = '/api';

        const form = document.getElementById('url-form');
        const urlInput = document.getElementById('url-input');
        const submitButton = document.getElementById('submit-button');
        const chatContainer = document.getElementById('chat-container');
        const errorMessage = document.getElementById('error-message');

        let intervalId = null;
        let apiKey = null;
        let continuation = null;

        const youtube_parser = (url) => {
            const regExp = /^.*((youtu.be\\/)|(v\\/)|(\\/u\\/\\w\\/)|(embed\\/)|(watch\\?))\\??v?=?([^#&?]*).*/;
            const match = url.match(regExp);
            return (match && match[7].length === 11) ? match[7] : false;
        };

        const showError = (message) => {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        };

        const clearError = () => {
            errorMessage.textContent = '';
            errorMessage.style.display = 'none';
        };
        
        const setLoading = (isLoading) => {
            submitButton.disabled = isLoading;
            submitButton.textContent = isLoading ? '読み込み中...' : 'チャット取得';
        };

        const addMessage = (msg) => {
            const isScrolledToBottom = chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 20;
            const msgDiv = document.createElement('div');
            msgDiv.className = 'chat-message';
            msgDiv.innerHTML = \`
                <img src="\${msg.photoUrl}" alt="\${msg.author}" class="author-photo">
                <div class="message-body">
                    <span class="timestamp">\${msg.timestamp}</span>
                    <span class="author-name">\${msg.author}</span>
                    <span class="message-text">\${msg.message}</span>
                </div>
            \`;
            chatContainer.appendChild(msgDiv);
            if (isScrolledToBottom) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        };
        
        const fetchChat = async () => {
            if (!continuation || !apiKey) return;

            try {
                const response = await fetch(\`\${API_BASE_URL}/chat\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ continuation, apiKey }),
                });

                if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);
                
                const chatData = await response.json();

                if (chatData.continuationContents) {
                    const actions = chatData.continuationContents.liveChatContinuation.actions || [];
                    actions
                        .map(action => action.addChatItemAction?.item.liveChatTextMessageRenderer)
                        .filter(Boolean)
                        .forEach(renderer => {
                            addMessage({
                                id: renderer.id,
                                author: renderer.authorName.simpleText,
                                message: renderer.message.runs.map(run => run.text).join(''),
                                photoUrl: renderer.authorPhoto.thumbnails[0].url,
                                timestamp: renderer.timestampText?.simpleText || '',
                            });
                        });
                    
                    continuation = chatData.continuationContents.liveChatContinuation.continuations[0].invalidationContinuationData?.continuation || chatData.continuationContents.liveChatContinuation.continuations[0].timedContinuationData?.continuation;
                } else {
                    console.log("チャットが終了したか、新しいメッセージがありません。");
                    clearInterval(intervalId);
                }

            } catch (err) {
                console.error('Error fetching chat:', err);
                showError('新しいチャットメッセージの取得に失敗しました。');
                clearInterval(intervalId);
            }
        };

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (intervalId) clearInterval(intervalId);

            clearError();
            chatContainer.innerHTML = '';
            setLoading(true);

            const videoId = youtube_parser(urlInput.value);
            if (!videoId) {
                showError('無効なYouTube URLです');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(\`\${API_BASE_URL}/start-chat\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ videoId }),
                });

                if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);

                const startData = await response.json();

                if(startData.error) {
                    throw new Error(startData.error);
                }

                apiKey = startData.apiKey;
                continuation = startData.continuation;

                await fetchChat();
                intervalId = setInterval(fetchChat, 5000);

            } catch (err) {
                console.error('Error starting chat:', err);
                showError('チャットの開始に失敗しました。URLがライブ配信のものであることを確認してください。');
            } finally {
                setLoading(false);
            }
        });
    </script>
</body>
</html>
\`;

// Universal handler logic
async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (path === '/') {
        return new Response(HTML_CONTENT, {
            headers: { ...corsHeaders, 'Content-Type': 'text/html;charset=utf-8' },
        });
    }

    if (path === '/api/start-chat' && request.method === 'POST') {
        try {
            const { videoId } = await request.json();
            const ytResponse = await fetch(\`https://www.youtube.com/watch?v=\${videoId}\`, {
                headers: { 'Accept-Language': 'en-US,en;q=0.5' }
            });
            const html = await ytResponse.text();

            const match = html.match(/ytInitialData = ({.*?});/);
            if (!match || !match[1]) throw new Error('Could not find ytInitialData');
            
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

            if (!continuation || !apiKeyMatch || !apiKeyMatch[1]) throw new Error('Could not find continuation token or API key');
            
            const apiKey = apiKeyMatch[1];
            return new Response(JSON.stringify({ continuation, apiKey }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
    }

    if (path === '/api/chat' && request.method === 'POST') {
        try {
            const { continuation, apiKey } = await request.json();
            const ytResponse = await fetch(\`https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?key=\${apiKey}\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: { client: { clientName: 'WEB', clientVersion: '2.20210721.00.00' } },
                    continuation,
                }),
            });
            
            const data = await ytResponse.json();
            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        } catch(e) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
    }

    return new Response('Not Found', { status: 404 });
}

// This export is for modules-based environments like Cloudflare Workers
export { handleRequest };
