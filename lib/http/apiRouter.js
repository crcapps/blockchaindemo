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
  getWallet
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
const doValidate = (blockChain) => async (ctx) => {
  const token = { token: `${node}-${proof}-${Date.now()}` }
  const {
    proof,
    node,
    data = { token }
  } = ctx.request.body

  if (!data.hasOwnProperty(token)) {
    data.token = token
  }

  if (!proof) {
    ctx.throw(400, 'Proof of work required')
  } else {
    const block = blockChain.addBlock(proof, data, node)
    if (block) {
      ctx.status = 201
      ctx.body = {
        block
      }
    } else {
      ctx.throw(422, 'Invalid proof of work')
    }
  }
}

const apiRoutes = (blockChain) => ({
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
    action: doValidate(blockChain)
  }
})

const routeApi = (blockChain, app) => {
  Object.entries(apiRoutes(blockChain))
    .forEach(([route, { method, action }]) => {
      app.use(method(route, action))
    })
}

module.exports = {
  apiRoutes,
  routeApi
}
