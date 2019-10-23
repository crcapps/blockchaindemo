require('dotenv').config()
const db = require('./lib/db')
const { Server } = require('./lib/http')

db.init()
  .then(blockChain => {
    const server = Server(blockChain, db)
    server.listen(process.env.PORT || 3000)
  })
  .catch(console.error)
