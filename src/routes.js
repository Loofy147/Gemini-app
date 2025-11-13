const express = require('express');
const Joi = require('joi');
const User = require('./models/User');

const router = express.Router();

const schemas = {
  register: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),
  login: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),
  settings: Joi.object({
    geminiApiKey: Joi.string().allow(''),
    githubToken: Joi.string().allow(''),
  }),
};

const validate = (schema, source = 'body') => (req, res, next) => {
  const { error } = schema.validate(req[source]);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  next();
};

const authenticate = async (req, res, next) => {
  if (!req.session.userId) {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(401).send('Unauthorized');
    }
    return res.redirect('/login.html');
  }
  req.user = await User.findByPk(req.session.userId);
  next();
};

router.post('/register', validate(schemas.register), async (req, res) => {
  try {
    const user = await User.create(req.body);
    req.session.userId = user.id;
    res.redirect('/');
  } catch (error) {
    res.status(400).send('Username already exists');
  }
});

router.post('/login', validate(schemas.login), async (req, res) => {
  const user = await User.findOne({ where: { username: req.body.username } });
  if (user && await user.validPassword(req.body.password)) {
    req.session.userId = user.id;
    res.redirect('/');
  } else {
    res.status(401).send('Invalid username or password');
  }
});

router.post('/settings', authenticate, validate(schemas.settings), async (req, res) => {
  try {
    await req.user.update(req.body);
    res.redirect('/');
  } catch (error) {
    res.status(500).send('Error updating settings');
  }
});

module.exports = {
  router,
  authenticate,
  validate
};
