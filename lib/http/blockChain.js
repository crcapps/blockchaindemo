const blocks = 'blocks'
const wallets = 'wallets'
const validate = 'validate'
const resources = {
  blocks,
  wallets,
  validate
}

/**
 * Gets the entire blockchain
 * @param {Object} blockchain - The blockchain to get
 * @returns {Object[]} Array of blocks making up the chain 
 */
const getBlocks = (blockchain, shouldShowOwner = true) => {
  const { chain: blocks } = blockchain
  return shouldShowOwner ? {
    blocks: blocks.slice(1).map(block => {
      block.owner = blockchain.owner(block.index)
      return block
    })
  } : { blocks }
}

/**
 * Gets the blocks owned by a node
 * @param {Object} blockchain - The blockchain to get
 * @param {string} node - The address of the node to display the wallet for
 * @returns {Object[]} The blocks owned by the node
 */
const getWallet = (blockchain, node) => {
  const wallet = blockchain.wallet(node)
  return { wallet }
}

/**
 * 
 * @param {Object} blockchain - The blockchain to get
 * @param {number} index - The index of the block to display
 * @param {boolean} [shouldShowOwner=true] - Should look up and display owner information for the block
 * @returns {Object} The block for this index
 */
const getBlock = (blockchain, index, shouldShowOwner = true) => {
  const block = blockchain.chain[index]
  if (block && shouldShowOwner) {
    block.owner = blockchain.owner(block.index)
  }

  return { block }
}

/**
 * Gets all nodes in the blockchain
 * @param {Object} blockChain - The blockchain to get the nodes of
 * @param {boolean} [shouldShowWallet=true] - Show wallet information for each nodes
 * @returns {Object[]} The blockchain's nodes
 */
const getNodes = (blockChain, shouldShowWallet = true) => {
  const nodes = shouldShowWallet ? blockChain.nodes.map((node) => {
    const wallet = blockChain.wallet(node)
    return {
      node,
      wallet
    }
  }) : blockChain.nodes.map(node => ({ node }))

  return { nodes }
}

/**
 * Attempts to add a block to the chain
 * @param {Object} blockChain - The blockchain to add to
 * @param {string} proof - Proof of Work
 * @param {*} data - Nonfungible token for the block
 * @param {string} node - Node address adding this block
 * @returns {(Object|null)} The block added, or null if invalid
 */
const addBlock = (blockChain, proof, data, node) => {
  return blockChain.addBlock(proof, data, node)
}

module.exports = {
  resources,
  getBlocks,
  getWallet,
  getBlock,
  getNodes,
  addBlock
}