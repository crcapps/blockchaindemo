const path = require('path')
const router = require("koa-route")
const serve = require('koa-static')
const send = require('koa-send')

const publicPath = path.join(__dirname, 'public')

const doIndex = async (ctx) => {
  return await send(ctx, 'index.html', { root: publicPath })
}

const routeStatic = async (app) => {
  app.use(serve(publicPath))
  app.use(router.get(`/:route`, doIndex))
  app.use(router.get(`/:route/:id`, doIndex))
}

module.exports = {
  doIndex,
  routeStatic
}