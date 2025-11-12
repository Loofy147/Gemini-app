const WebSocket = require('ws');
const { spawn } = require('child_process');
const argv = require('string-argv');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

function getHistory(userId) {
  const historyPath = path.join(dataDir, `${userId}.json`);
  if (fs.existsSync(historyPath)) {
    return JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
  }
  return [];
}

function saveHistory(userId, history) {
  const historyPath = path.join(dataDir, `${userId}.json`);
  fs.writeFileSync(historyPath, JSON.stringify(history));
}

function setupWebSocket(server, sessionParser) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    sessionParser(req, {}, () => {
      if (!req.session.apiKey) {
        ws.close();
        return;
      }

      const userId = req.session.userId;
      const history = getHistory(userId);
      ws.send(JSON.stringify({ type: 'history', data: history }));

      ws.on('message', (message) => {
        const { command } = JSON.parse(message);
        if (!command) {
          return;
        }

        if (!history.includes(command)) {
          history.push(command);
          saveHistory(userId, history);
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
}

module.exports = setupWebSocket;
