const router = require("koa-route")
const API_VERSION = `v${process.env.API_VERSION || 1}`
const API_BASE = process.env.API_BASE || `/api/${API_VERSION}/`

const {
  resources: {
    blocks,
    wallets,
    validate
  },
  getBlock,
  getBlocks,
  getNodes,
  getWallet,
  addBlock
} = require('./blockChain')

const blocksRoute = `${API_BASE}${blocks}`
const blocksMethod = router.get
const doGetBlocks = (blockChain) => async (ctx) => {
  const blocks = getBlocks(blockChain)
  ctx.body = blocks
}

const blockRoute = `${API_BASE}${blocks}/:index`
const blockMethod = router.get
const doGetBlock = (blockChain) => async (ctx, index) => {
  const block = getBlock(blockChain, index)
  ctx.body = block
}

const walletsRoute = `${API_BASE}${wallets}`
const walletsMethod = router.get
const doGetWallets = (blockChain) => async (ctx) => {
  const wallets = getNodes(blockChain)
  ctx.body = wallets
}

const walletRoute = `${API_BASE}${wallets}/:node`
const walletMethod = router.get
const doGetWallet = (blockChain) => async (ctx, node) => {
  const wallet = getWallet(blockChain, node)
  ctx.body = wallet
}

const validateRoute = `${API_BASE}${validate}`
const validateMethod = router.post
const doValidate = (blockChain, db) => async (ctx) => {
  const {
    proof,
    node,
    data = {}
  } = ctx.request.body

  const token = `${node}-${proof}-${Date.now()}`

  if (!data.hasOwnProperty(token)) {
    data.token = token
  }

  if (!proof || !node) {
    const message = `${
      !proof ? 'proof of work' : ''
      }${
      !proof && !node ? ' and ' : ''
      }${
      !node ? 'node address' : ''
      } required`
    ctx.throw(400, message)
  } else {
    const block = addBlock(blockChain, proof, data, node)
    if (block) {
      ctx.status = 201
      ctx.body = {
        block
      }
      db.update(blockChain)
    } else {
      ctx.throw(422, 'Invalid proof of work')
    }
  }
}

const apiRoutes = (blockChain, db) => ({
  [blocksRoute]: {
    method: blocksMethod,
    action: doGetBlocks(blockChain)
  },
  [blockRoute]: {
    method: blockMethod,
    action: doGetBlock(blockChain)
  },
  [walletsRoute]: {
    method: walletsMethod,
    action: doGetWallets(blockChain)
  },
  [walletRoute]: {
    method: walletMethod,
    action: doGetWallet(blockChain)
  },
  [validateRoute]: {
    method: validateMethod,
    action: doValidate(blockChain, db)
  }
})

const routeApi = (blockChain, app) => {
  Object.entries(apiRoutes(blockChain, app.db))
    .forEach(([route, { method, action }]) => {
      app.use(method(route, action))
    })
}

module.exports = {
  apiRoutes,
  routeApi
}
