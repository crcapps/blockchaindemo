const blocks = 'blocks'
const wallets = 'wallets'
const resources = {
  blocks,
  wallets
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

module.exports = {
  resources,
  getBlocks,
  getWallet,
  getBlock,
  getNodes
}