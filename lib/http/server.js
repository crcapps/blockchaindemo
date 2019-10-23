const path = require('path')
const Koa = require('koa')
const router = require("koa-route")
const serve = require('koa-static')
const send = require('koa-send')
const middleware = require('./middleware')

const publicPath = path.join(__dirname, 'public')
const app = new Koa()
app.use(middleware)

const API_VERSION = `v${process.env.API_VERSION || 1}`
const API_BASE = process.env.API_BASE || `/api/${API_VERSION}/`

module.exports = (blockChain, db) => {
  const { resourceName } = 'blocks'
  app.use(router.get(`${API_BASE}${resourceName}`, (ctx) => {

  }))
  app.use(router.get(`${API_BASE}${resourceName}/:index`, (ctx, index) => {
    const block = blockChain.chain[0]
  }))
  app.use(serve(publicPath))
  app.use(router.get(`/:id`, async (ctx) => {
    await send(ctx, 'index.html', { root: publicPath })
  }))

  return app
}
