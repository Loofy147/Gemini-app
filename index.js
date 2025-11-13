const express = require('express');
const http = require('http');
const session = require('express-session');
const bodyParser = require('body-parser');
const setupWebSocket = require('./src/websocket');
const { router, authenticate, validate } = require('./src/routes');
const config = require('./src/config');
const logger = require('./src/logger');
const sequelize = require('./src/database');
const User = require('./src/models/User');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const port = 3000;

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
    styleSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
    connectSrc: ["'self'", "ws:"],
  }
}));

const sessionParser = session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: true,
});

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(sessionParser);
app.use(router);

// Load plugins
const pluginsDir = path.join(__dirname, 'src/plugins');
fs.readdirSync(pluginsDir).forEach(file => {
  if (file.endsWith('.js') && file === 'github.js') {
    const plugin = require(path.join(pluginsDir, file));
    if (plugin.register) {
      plugin.register(router, authenticate, validate);
    }
  }
});

setupWebSocket(server, sessionParser);

sequelize.sync().then(() => {
  server.listen(port, () => {
    logger.info(`Server listening at http://localhost:${port}`);
  });
});
