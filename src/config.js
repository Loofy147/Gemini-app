require('dotenv').config();
const Joi = require('joi');

const envVarsSchema = Joi.object({
  SESSION_SECRET: Joi.string().required(),
}).unknown();

const { value: envVars, error } = envVarsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  sessionSecret: envVars.SESSION_SECRET,
};

module.exports = config;
