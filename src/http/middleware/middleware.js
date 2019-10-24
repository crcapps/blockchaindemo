const cors = require('@koa/cors')
const helmet = require("koa-helmet")
const compose = require("koa-compose")
const responseTime = require('koa-response-time')
const morgan = require('koa-morgan')
const bodyParser = require('koa-bodyparser')

module.exports = compose([
  responseTime(),
  morgan('combined'),
  helmet(),
  cors(),
  bodyParser()
])
