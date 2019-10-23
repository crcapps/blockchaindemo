const cors = require('@koa/cors')
const helmet = require("koa-helmet")
const compose = require("koa-compose")
const responseTime = require('koa-response-time')
const morgan = require('koa-morgan')

module.exports = compose([
  responseTime(),
  helmet(),
  cors(),
  morgan('combined'),
])
