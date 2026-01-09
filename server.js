// This file is the entrypoint for Node.js environments (local and Render.com)
const app = require('./api/index.js');
const path = require('path');

const PORT = process.env.PORT || 3000;

// The static file serving is already handled in api/index.js,
// but we add it here as well for local development to be robust.
// This ensures that visiting http://localhost:3000/ serves the index.html
app.use(require('express').static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});