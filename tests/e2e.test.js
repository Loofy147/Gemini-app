const request = require('supertest');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const { router, authenticate, validate } = require('../src/routes');
const githubPlugin = require('../src/plugins/github');
const User = require('../src/models/User');
const sequelize = require('../src/database');

const app = express();
const secret = 'test-secret';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret, resave: false, saveUninitialized: true }));
app.use(router);
githubPlugin.register(router, authenticate, validate);

describe('E2E', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  it('should allow a user to register, login, and use the application', async () => {
    // Register
    const registerRes = await request(app)
      .post('/register')
      .send({ username: 'testuser', password: 'password' });
    expect(registerRes.statusCode).toEqual(302);
    expect(registerRes.headers.location).toEqual('/');

    // Login
    const loginRes = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'password' });
    expect(loginRes.statusCode).toEqual(302);
    expect(loginRes.headers.location).toEqual('/');

    // Get the session cookie
    const cookie = loginRes.headers['set-cookie'];

    // Use the application
    const prsRes = await request(app)
      .get('/github/prs?owner=google-gemini&repo=gemini-cli')
      .set('Cookie', cookie);
    expect(prsRes.statusCode).toEqual(200);
  }, 10000);

  it('should return 401 if not authenticated', async () => {
    const res = await request(app).get('/github/prs');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/login.html');
  });
});
