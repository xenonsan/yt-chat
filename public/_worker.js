// public/_worker.js
// This is the entrypoint for Cloudflare Pages.
// It imports the universal handler and uses it directly.

import { handleRequest } from '../src/handler.js';

export default {
    fetch: handleRequest
};
