require('dotenv').config()

const {
  db,
  http: {
    Server
  }
} = require('./src')

db.init()
  .then(blockChain => {
    const server = Server(blockChain, db)
    server.listen(process.env.PORT || 3000)
  })
  .catch(console.error)
