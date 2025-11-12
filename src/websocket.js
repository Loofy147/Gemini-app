const WebSocket = require('ws');
const { spawn } = require('child_process');
const argv = require('string-argv');

function setupWebSocket(server, sessionParser) {
  const wss = new WebSocket.Server({ server });

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
}

module.exports = setupWebSocket;
