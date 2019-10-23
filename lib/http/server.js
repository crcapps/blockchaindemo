const path = require('path')
const Koa = require('koa')
const router = require("koa-route")
const serve = require('koa-static')
const send = require('koa-send')
const middleware = require('./middleware')
const { routeApi } = require('./apiRouter')

const publicPath = path.join(__dirname, 'public')
const app = new Koa()
app.use(middleware)

module.exports = (blockChain, db) => {
  app.db = db
  routeApi(blockChain, app)
  app.use(serve(publicPath))
  app.use(router.get(`/:route`, async (ctx) => {
    await send(ctx, 'index.html', { root: publicPath })
  }))
  app.use(router.get(`/:route/:id`, async (ctx) => {
    await send(ctx, 'index.html', { root: publicPath })
  }))

  return app
}
