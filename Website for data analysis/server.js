const express = require('express');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Paths to C++ query engine executables
const enginePath = path.join(__dirname, 'query_engine.exe');
const powerEnginePath = path.join(__dirname, 'power_engine.exe');

// Check if query engines exist
if (!fs.existsSync(enginePath)) {
    console.error(`Warning: query_engine.exe not found at ${enginePath}.`);
}
if (!fs.existsSync(powerEnginePath)) {
    console.error(`Warning: power_engine.exe not found at ${powerEnginePath}.`);
}

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to execute C++ query engines
function runEngine(exePath, args, res) {
    execFile(exePath, args, { maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution error for ${exePath}: ${error.message}`);
            return res.status(500).json({ error: 'Internal Server Error running query engine', details: error.message });
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
        }
        
        try {
            const data = JSON.parse(stdout);
            res.json(data);
        } catch (e) {
            console.error(`JSON Parse Error: ${e.message}. Output was: ${stdout}`);
            res.status(500).json({ error: 'Failed to parse JSON response from query engine' });
        }
    });
}

// API Endpoints - Project 1 (Emigrants)
app.get('/api/summary', (req, res) => {
    runEngine(enginePath, ['--summary'], res);
});

app.get('/api/filters', (req, res) => {
    runEngine(enginePath, ['--filters'], res);
});

app.get('/api/query', (req, res) => {
    const region = req.query.region || 'ALL';
    const province = req.query.province || 'ALL';
    const municipality = req.query.municipality || 'ALL';
    
    const args = [
        '--query',
        '--region', region,
        '--province', province,
        '--municipality', municipality
    ];
    
    runEngine(enginePath, args, res);
});

// API Endpoints - Project 2 (Power Generation)
app.get('/api/power/summary', (req, res) => {
    runEngine(powerEnginePath, ['--summary'], res);
});

app.get('/api/power/query', (req, res) => {
    const year = req.query.year || '2020';
    runEngine(powerEnginePath, ['--year', year], res);
});

// Catch-all route to serve the SPA frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Node.js Backend Server running on port ${PORT}`);
    console.log(`👉 Access website at: http://localhost:${PORT}`);
    console.log(`==================================================`);
});
