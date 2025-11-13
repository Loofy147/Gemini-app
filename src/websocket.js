const WebSocket = require('ws');
const User = require('./models/User');
const geminiPlugin = require('./plugins/gemini');

function setupWebSocket(server, sessionParser) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    sessionParser(req, {}, async () => {
      if (!req.session.userId) {
        ws.close();
        return;
      }

      const user = await User.findByPk(req.session.userId);
      geminiPlugin.register(ws, req, user);
    });
  });
}

module.exports = setupWebSocket;
