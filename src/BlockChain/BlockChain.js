const crypto = require('crypto')
const config = require('./config')

const {
  HASH_TYPE,
  HASH_TYPES: { SHA256 },
  CRYPTO_SECRET,
  DIGEST,
  DIGEST_TYPES: {
    HEX
  },
  PROOF_SEED,
  REQUIRE_PROOF,
  RESOLUTION_CHAIN_WEIGHT,
  RESOLUTION_MATCH_LENGTH,
  ADVANCE_BLOCK,
  ZERO_NODE_ADDRESS,
  GENESIS_PROOF,
  GENESIS_DATA
} = config

/**
 * @description Creates a cryptographic hash of data
 * @param {string} data - The data to hash
 * @param {string} [hashType=sha256] - Cryptographic algorithm type to use
 * @param {string} [cryptoSecret=12345] - Cryptographic salt for hash
 * @param {string} [digest=hex] - Digest type for returned hash
 * @returns {string} The cryptographic hash of the data
 */
const hash = (data, hashType = HASH_TYPE || SHA256, cryptoSecret = CRYPTO_SECRET, digest = DIGEST || HEX) => {
  return crypto.createHmac(hashType, cryptoSecret)
    .update(JSON.stringify(data))
    .digest(digest)
}

/**
 * @description Calculates the current weight for the length of a blockchain in determining resolution hash length
 * @param {Object} blockChain - The blockchain to calculate the weight for
 * @returns {number} The weight of the chain's length
 * @see calculateResolutionHashLength
 */
const calculateChainWeight = (blockChain) => {
  return Math.floor((blockChain.lastBlock().index + 1) * +RESOLUTION_CHAIN_WEIGHT)
}

/**
 * Calculates the length of the resolution hash for a blockchain
 * @param {Object} blockChain - The blockchain to calculate the resolution hash length for
 * @returns {number} The required length of the resolution hash to match to mine a block
 * @see calculateResolutionHash
 */
const calculateResolutionHashLength = (blockChain) => {
  return +RESOLUTION_MATCH_LENGTH + calculateChainWeight(blockChain)
}

/**
 * Calculates the resolution hash for a blockchain
 * @param {Object} blockChain - The blockchain to calculate the resolution hash for
 * @returns {string} The resolution hash required to match to mine a block
 */
const calculateResolutionHash = (blockChain) => {
  return hash(`${
    blockChain.chain[ADVANCE_BLOCK ? blockChain.chain.length - 1 : 0].thisHash
    }${PROOF_SEED}`)
    .substring(0, calculateResolutionHashLength(blockChain))
}

/**
 * Sorts objects by a property representing a UNIX timestamp, ascending
 * @callback byTimestamp
 * @param {Object} a - First object to compare
 * @param {number} a.timestamp - First object's timestamp for comparison
 * @param {*} b - Second object to compare
 * @param {number} b.timestamp - Second object's timestamp for comparison
 * @returns {number} Comparison (negative, zero, positive)
 */
const byTimestamp = (a, b) => {
  return a.timestamp - b.timestamp
}
/**
 * Constructor for a block in a blockchain
 * @param {string} [proof] - Proof of work submitted to mine this block
 * @param {*} [data] - Nonfungible token payload for this block
 * @param {number} [index=0] - Index of this block in the chain
 * @param {string} [lastHash=0] - Hash of the previous block in the chain
 * @param {number} [timestamp] - UNIX timestamp when this block was mined
 * @param {string} [transactionHash=0] - Hash of transactional data for this block
 * @param {Object[]} [transactions] - Transactions between mining times of prior block and this one
 * @returns {Object} A new block for the chain
 */
const Block = (
  proof = GENESIS_PROOF,
  data = GENESIS_DATA,
  index = 0,
  lastHash = '0',
  timestamp = Date.now(),
  transactionHash = '0',
  transactions = [],
) => {
  return {
    data,
    index,
    lastHash,
    proof,
    thisHash: hash(`${index}${timestamp}${JSON.stringify(data)}${lastHash}`),
    timestamp,
    transactions,
    transactionHash
  }
}

/**
 * Creates a genesis block for a blockchain
 * @returns {Object} A genesis block
 * @see Block
 */
const createGenesisBlock = () => {
  return Block()
}

/**
 * Validates a proof of work for a given resolution hash
 * @param {string} lastProof - Proof of work for the prior block in the chain
 * @param {string} proof - Proof of work for this block
 * @param {string} resolutionHash - Resolution hash required for match
 * @returns {(string|null)} A matching hash, or null if no match
 */
const validateProof = (lastProof, proof, resolutionHash) => {
  const guessHash = crypto.createHmac(HASH_TYPE, CRYPTO_SECRET)
    .update(`${lastProof}${proof}`)
    .digest(DIGEST)
  return guessHash.substr(0, resolutionHash.length) === resolutionHash ? guessHash : null
}

/**
 * Derives a candidate for the next block for a chain
 * @param {string} proof - Proof used to calculate this block
 * @param {[Object]} lastBlock - The prior block in the chain
 * @param {[Object]} data - Nonfungible token payload for this block
 * @param {[Object[]]} transactions - Transactions occuring since last block was mined
 */
const nextBlock = (proof = null, lastBlock = createGenesisBlock(), data = {}, transactions = []) => {
  return Block(
    proof,
    data,
    lastBlock.index + 1,
    lastBlock.thisHash,
    Date.now(),
    computeTransactionHash(transactions, lastBlock.transactionHash),
    transactions
  )
}

/**
 * Compute the transaction hash for a block
 * @param {Object[]} transactions - Transactions since last block was mined
 * @param {string} lastHash - Transaction hash for the prior block 
 */
const computeTransactionHash = (transactions, lastHash) => {
  return hash(`${hash(JSON.stringify(transactions))}${lastHash}`)
}

/**
 * Constructor for a blockchain
 * @param {[Object[]]} chain - Preexisting chain of nodes for this blockchain
 * @param {[Object[]]} transactions - Preexisting transactions for this blockchain
 * @param {[string[]]} nodes - Endpoint nodes for this blockchain
 * @param {[Object]} badProofs - Memoized list of bad proofs (dynamic programming to save time)
 */
const BlockChain = (
  chain = [createGenesisBlock()],
  transactions = [],
  nodes = [ZERO_NODE_ADDRESS],
  badProofs = {}
) => {
  return {
    chain,
    transactions,
    nodes,
    badProofs,

    /**
     * Derives the last block added to the chain
     * @returns {Object} The last block added to the chain
     */
    lastBlock() {
      return this.chain.length === 1 ? this.chain[0] : this.chain.slice(-1)[0]
    },

    /**
     * Registers a node with the blockchain
     * @param {string} address - The address of the node to register
     * @returns {string[]} The list of registered nodes
     */
    registerNode(address) {
      this.nodes.push(address)
      return this.nodes
    },

    /**
     * Initiates a transaction between two nodes
     * @param {string} sender - Address of the sending node
     * @param {string} recipient - Address of the receiving node
     * @param {number} index - The subject block of the transaction
     * @returns {(number|null)} - The next index available, or null if the transaction failed
     */
    transaction(sender, recipient, index) {
      if (this.nodes.includes(sender) && this.nodes.includes(recipient)) {
        this.transactions.push({
          sender,
          recipient,
          index,
          timestamp: Date.now()
        })
        return this.lastBlock().index + 1
      }

      return null
    },

    /**
     * Validates a proof of work, memoizing bad proofs
     * @param {string} proof - The proof of work to validate
     * @returns {(string|false)} The hash of a valid proof, or false if the proof was invalid
     */
    validateProof(proof) {
      if (proof in this.badProofs) {
        return false
      }
      const lastBlock = this.lastBlock()
      const resolutionHash = calculateResolutionHash(this)
      const validHash = validateProof(
        lastBlock.proof,
        proof,
        resolutionHash
      )
      if (!validHash) {
        this.badProofs[proof] = true
      }
      return validHash
    },

    /**
     * Validates all aspects of a block in the chain (index, transaction hash, hash)
     * @param {Object} block - The block to validate
     * @returns {(Object|null)} - The block, if validated, or null if invalid
     */
    validateBlock(block) {
      const lastBlock = this.lastBlock()
      const isMatchingHash = block.lastHash === lastBlock.thisHash
      const isMatchingIndex = block.index === lastBlock.index + 1
      const transactionHash = computeTransactionHash(
        block.transactions,
        lastBlock.transactionHash
      )
      const isMatchingTransactionHash = block.transactionHash === transactionHash
      const resolutionHash = calculateResolutionHash(this)
      const validHash = validateProof(
        lastBlock.proof,
        block.proof,
        resolutionHash
      )
      const isValid = isMatchingHash && isMatchingIndex && isMatchingTransactionHash && validHash
      return isValid ? block : null
    },

    /**
     * Validates the blockchain
     * @returns {(Object|null)} The chain, if valid, or null if invalid
     */
    validateChain() {
      return this.chain.slice(1).every((block) => {
        return this.validateBlock(block) ? this : null
      })
    },

    /**
     * Adds a block to the chain, performing validation
     * @param {string} proof - Proof of work for the block to add
     * @param {*} data - Nonfungible token payload for the block to add
     * @param {string} node - Address of the node adding the block
     * @returns {(Object|null)} The block, if added, or null if not added
     */
    addBlock(proof = null, data = {}, node = ZERO_NODE_ADDRESS) {
      const transactions = this.transactions
      const lastBlock = this.lastBlock()
      const block = nextBlock(proof, lastBlock, data, transactions)
      const isBlockValid = !REQUIRE_PROOF || this.validateBlock(block)
      if (isBlockValid) {
        this.badProofs = {}
        if (!this.nodes.includes(node)) {
          this.nodes.push(node)
        }

        this.chain.push(block)
        this.transactions = []
        this.transaction(ZERO_NODE_ADDRESS, node, block.index)
      }

      return isBlockValid ? block : null
    },

    /**
     * Gets all transactions on the blockchain
     * @returns {Object[]} Array of transactions
     */
    allTransactions() {
      const transactions = this.chain.map(block => block.transactions)
        .flat()
      transactions.push(...this.transactions)
      return transactions.sort(byTimestamp)
    },

    /**
     * Gets all transactions on the blockchain, grouped by sender
     * @returns {Object} Transactions grouped by sender address
     */
    transactionsBySender() {
      return this.allTransactions()
        .reduce((accumulator, current) => {
          return Object.keys(accumulator)
            .includes(current.sender) ? {
              ...accumulator,
              [current.sender]: [
                ...accumulator[current.sender],
                current
              ]
            } : {
              ...accumulator,
              [current.sender]: [current]
            }
        }, {})
    },

    /**
    * Gets all transactions on the blockchain, grouped by recipient
    * @returns {Object} Transactions grouped by recipient address
    */
    transactionsByRecipient() {
      return this.allTransactions()
        .reduce((accumulator, current) => {
          return Object.keys(accumulator)
            .includes(current.recipient) ? {
              ...accumulator,
              [current.recipient]: [
                ...accumulator[current.recipient],
                current
              ]
            } : {
              ...accumulator,
              [current.recipient]: [current]
            }
        }, {})
    },

    /**
    * Gets all transactions on the blockchain, grouped by node (may contain duplicate indices across nodes)
    * @returns {Object} Transactions grouped by node address
    */
    transactionsByNode() {
      const transactions = this.transactionsBySender()
      const senders = Object.keys(transactions)
      Object.entries(this.transactionsByRecipient()).forEach(([recipient, receivedTransactions]) => {
        if (senders.includes(recipient)) {
          transactions[recipient] = [
            ...transactions[recipient],
            ...receivedTransactions
          ]
        } else {
          transactions[recipient] = [
            ...receivedTransactions
          ]
        }
      })
      return transactions
    },

    /**
     * Gets all transactions on the blockchain, grouped by block index
     * @returns {Object} Transactions grouped by block index
     */
    transactionsByIndex() {
      return this.allTransactions()
        .reduce((accumulator, current) => {
          return Object.keys(accumulator)
            .includes(current.index.toString()) ? {
              ...accumulator,
              [current.index]: [
                ...accumulator[current.index],
                current
              ]
            } : {
              ...accumulator,
              [current.index]: [current]
            }
        }, {})
    },

    /**
     * Gets all transactions on the blockchain involving a specific node
     * @param {string} node - Address of node
     * @returns {Object[]} Transactions for the given node
     */
    transactionsForNode(node = '0') {
      return (this.transactionsByNode()[node] || [])
        .sort(byTimestamp)
    },

    /**
     * Gets all transactions on the blockchain for a specific block index
     * @param {number} index - The index of the block
     * @returns {Object[]} Transactions for the given block index
     */
    transactionsForIndex(index = 0) {
      return (this.transactionsByIndex()[index] || [])
        .sort(byTimestamp)
    },

    /**
     * Determines the owning node of a specfific block in the chain
     * @param {number} index - The index of the block
     * @param {boolean} [shouldTrace=false] - Should perform a fully traced or quick calculation
     * @returns {string} The owning address of the block index
     */
    owner(index = 0, shouldTrace = false) {
      const transactions = this.transactionsForIndex(index)
      return shouldTrace ? transactions
        .sort(byTimestamp)
        .reduce((_, current) => {
          return current.recipient
        }, '') : transactions.length ? transactions.sort(byTimestamp)
          .slice(-1)[0].recipient : ZERO_NODE_ADDRESS
    },

    /**
     * Retrieves all blocks owned by an address
     * @param {string} node - The address of the node
     * @param {boolean} [shouldTrace=false] - Should perform a fully traced or quick calculation
     * @returns {Object[]} All block indices owned by the node address
     */
    wallet(node = '0', shouldTrace = true) {
      return this.chain.slice(1).filter(block => this.owner(block.index, shouldTrace) === node)
    }
  }
}

module.exports = BlockChain
