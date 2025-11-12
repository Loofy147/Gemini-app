const request = require('supertest');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const routes = require('../src/routes');

const app = express();
const secret = 'test-secret';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret, resave: false, saveUninitialized: true }));
app.use(routes);

describe('Routes', () => {
  it('should redirect to / after successful login', async () => {
    const res = await request(app)
      .post('/login')
      .send({ apiKey: 'test-key', githubToken: 'test-token' });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/');
  });

  it('should return 401 if not authenticated', async () => {
    const res = await request(app).get('/github/prs');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/login.html');
  });
});
