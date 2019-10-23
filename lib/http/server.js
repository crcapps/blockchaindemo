const Koa = require('koa')

const middleware = require('./middleware')
const { routeApi } = require('./apiRouter')
const { routeStatic } = require('./staticRouter')

const app = new Koa()
app.use(middleware)

module.exports = (blockChain, db) => {
  app.db = db
  routeApi(blockChain, app)
  routeStatic(app)
  return app
}
