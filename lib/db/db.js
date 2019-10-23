const { MongoClient } = require('mongodb')
const { MONGODB_URI } = require('./config')

const BlockChain = require('../BlockChain')

let client = null
let db = null
let blockChain = null
let blockChains = null

const init = async (uri = MONGODB_URI) => {
  if (!client) {
    client = await MongoClient.connect(uri, {
      useNewUrlParser: true, useUnifiedTopology: true
    })
  }
  db = client.db(client.s.options.dbName)
  blockChains = await db.collection('BlockChains')
  let persistedBlockChain = await blockChains.findOne()
  if (!persistedBlockChain) {
    persistedBlockChain = await blockChains.insertOne(BlockChain())
  }
  const {
    chain,
    nodes,
    transactions,
    badProofs
  } = persistedBlockChain
  blockChain = BlockChain(chain, nodes, transactions, badProofs)

  return blockChain
}

const update = async (blockChain) => {
  return await blockChains.findOneAndReplace({}, blockChain)
}

module.exports = {
  init,
  update,
  blockChain
}
