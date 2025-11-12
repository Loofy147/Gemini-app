const express = require('express');
const axios = require('axios');
const Joi = require('joi');

const router = express.Router();

const schemas = {
  login: Joi.object({
    apiKey: Joi.string().required(),
    githubToken: Joi.string().allow(''),
  }),
  githubPrs: Joi.object({
    owner: Joi.string().required(),
    repo: Joi.string().required(),
  }),
  githubPrDiff: Joi.object({
    owner: Joi.string().required(),
    repo: Joi.string().required(),
    pull_number: Joi.number().required(),
  }),
  githubPrComment: Joi.object({
    owner: Joi.string().required(),
    repo: Joi.string().required(),
    pull_number: Joi.number().required(),
    comment: Joi.string().required(),
  }),
  githubActionsRun: Joi.object({
    owner: Joi.string().required(),
    repo: Joi.string().required(),
    workflow_id: Joi.string().required(),
  }),
  githubActionsWorkflows: Joi.object({
    owner: Joi.string().required(),
    repo: Joi.string().required(),
  }),
};

const validate = (schema, source = 'body') => (req, res, next) => {
  const { error } = schema.validate(req[source]);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  next();
};

const authenticate = (req, res, next) => {
  if (!req.session.apiKey) {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(401).send('Unauthorized');
    }
    return res.redirect('/login.html');
  }
  next();
};

router.post('/login', validate(schemas.login), (req, res) => {
  req.session.apiKey = req.body.apiKey;
  req.session.githubToken = req.body.githubToken;
  res.redirect('/');
});

router.get('/github/prs', authenticate, validate(schemas.githubPrs, 'query'), async (req, res) => {
  const { owner, repo } = req.query;

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

router.get('/github/prs/:pull_number/diff', authenticate, validate(schemas.githubPrDiff, 'params'), async (req, res) => {
  const { owner, repo, pull_number } = req.params;

  try {
    const headers = {
      Accept: 'application/vnd.github.v3.diff',
    };
    if (req.session.githubToken) {
      headers.Authorization = `token ${req.session.githubToken}`;
    }
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}`, { headers });
    res.send(response.data);
  } catch (error) {
    res.status(500).send('Error fetching pull request diff');
  }
});

router.post('/github/prs/:pull_number/comments', authenticate, validate(schemas.githubPrComment), async (req, res) => {
  const { owner, repo, pull_number } = req.params;
  const { comment } = req.body;

  try {
    const headers = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (req.session.githubToken) {
      headers.Authorization = `token ${req.session.githubToken}`;
    }
    await axios.post(`https://api.github.com/repos/${owner}/${repo}/issues/${pull_number}/comments`, {
      body: comment
    }, { headers });
    res.send('Comment posted');
  } catch (error) {
    res.status(500).send('Error posting comment');
  }
});

router.post('/github/actions/run', authenticate, validate(schemas.githubActionsRun), async (req, res) => {
  const { owner, repo, workflow_id } = req.body;

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

router.get('/github/actions/workflows', authenticate, validate(schemas.githubActionsWorkflows, 'query'), async (req, res) => {
  const { owner, repo } = req.query;

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

module.exports = router;
