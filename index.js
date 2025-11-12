const express = require('express');
const app = express();
const port = 3000;
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const session = require('express-session');
const bodyParser = require('body-parser');
const axios = require('axios');
const argv = require('string-argv');

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
const crypto = require('crypto');

// In a production environment, this secret should be stored in an environment variable.
const secret = process.env.SESSION_SECRET || 'supersecretkey';

const sessionParser = session({
  secret: secret,
  resave: false,
  saveUninitialized: true,
});
app.use(sessionParser);

const authenticate = (req, res, next) => {
  if (!req.session.apiKey) {
    return res.redirect('/login.html');
  }
  next();
};

app.post('/login', (req, res) => {
  req.session.apiKey = req.body.apiKey;
  req.session.githubToken = req.body.githubToken;
  res.redirect('/');
});

app.use(express.json()); // Add this line to parse JSON bodies

wss.on('connection', (ws, req) => {
  sessionParser(req, {}, () => {
    if (!req.session.apiKey) {
      ws.close();
      return;
    }

    ws.on('message', (message) => {
      const { command } = JSON.parse(message);
      if (!command) {
        return;
      }

      const env = { ...process.env, GEMINI_API_KEY: req.session.apiKey };
      const gemini = spawn('./gemini-cli/cmd/gemini/gemini', argv(command), { env });

      gemini.stdout.on('data', (data) => {
        ws.send(JSON.stringify({ type: 'stdout', data: data.toString() }));
      });

      gemini.stderr.on('data', (data) => {
        ws.send(JSON.stringify({ type: 'stderr', data: data.toString() }));
      });

      gemini.on('close', (code) => {
        ws.send(JSON.stringify({ type: 'close', code }));
      });
    });
  });
});

app.get('/github/prs', authenticate, async (req, res) => {
  const { owner, repo } = req.query;
  if (!owner || !repo) {
    return res.status(400).send('Owner and repo are required');
  }

  try {
    const headers = {};
    if (req.session.githubToken) {
      headers.Authorization = `token ${req.session.githubToken}`;
    }
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls`, { headers });
    res.json(response.data);
  } catch (error) {
    res.status(500).send('Error fetching pull requests');
  }
});

app.post('/github/actions/run', authenticate, async (req, res) => {
  const { owner, repo, workflow_id } = req.body;
  if (!owner || !repo || !workflow_id) {
    return res.status(400).send('Owner, repo, and workflow_id are required');
  }

  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
    };
    if (req.session.githubToken) {
      headers.Authorization = `token ${req.session.githubToken}`;
    }
    await axios.post(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow_id}/dispatches`, {
      ref: 'main'
    }, { headers });
    res.send('Workflow triggered');
  } catch (error) {
    res.status(500).send('Error triggering workflow');
  }
});

app.get('/github/actions/workflows', authenticate, async (req, res) => {
  const { owner, repo } = req.query;
  if (!owner || !repo) {
    return res.status(400).send('Owner and repo are required');
  }

  try {
    const headers = {};
    if (req.session.githubToken) {
      headers.Authorization = `token ${req.session.githubToken}`;
    }
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/actions/workflows`, { headers });
    res.json(response.data);
  } catch (error) {
    res.status(500).send('Error fetching workflows');
  }
});

server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
