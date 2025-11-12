const express = require('express');
const http = require('http');
const session = require('express-session');
const bodyParser = require('body-parser');
const setupWebSocket = require('./src/websocket');
const routes = require('./src/routes');
const config = require('./src/config');
const logger = require('./src/logger');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const port = 3000;

const sessionParser = session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
});

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(sessionParser);
app.use((req, res, next) => {
  if (!req.session.userId) {
    req.session.userId = uuidv4();
  }
  next();
});
app.use(routes);

setupWebSocket(server, sessionParser);

server.listen(port, () => {
  logger.info(`Server listening at http://localhost:${port}`);
});
