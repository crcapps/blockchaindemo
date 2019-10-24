const GENERATING_FINGERPRINT = "Generating your fingerprint..."

let node = null

const getFingerprint = async (options = {}) => {
  const components = await Fingerprint2.getPromise(options)
  return Fingerprint2.x64hash128(components.map(component => component.value).join(''), 0xDEADBEEF)
}

const storeFingerprint = (fingerprint) => {
  window.localStorage.setItem('node', fingerprint)
}

const getAndStoreFingerprint = async () => {
  node = await getFingerprint()
  storeFingerprint(node)
  return node
}

const fetchBlocks = async () => {
  return fetch('/api/v1/blocks')
}

const fetchWallet = async (node) => {
  return fetch(`/api/v1/wallets/${node}`)
}

const fetchValidate = async (proof) => {
  return await fetch('/api/v1/validate', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      proof,
      node
    })
  })
}

const proveWork = async () => {
  let proof = 0
  do {
    try {
      const response = await fetchValidate(proof.toString(16))
      const { block } = await response.json()
      if (block) {
        return block
      }
    } catch (error) {
      // swallow it for now
    } finally {
      proof++
    }
  } while (true)
}

const handleClickChain = async () => {
  history.pushState({ page: 0 }, 'View Blockchain', '/chain')
  const main = document.getElementsByTagName('main')[0]
  main.innerHTML = ''
  const response = await fetchBlocks()
  const { blocks } = await response.json()
  if (!blocks.length) {
    const emptyMessage = 'There are no blocks in the chain.  Select "mine" from the navigation to create some.'
    const p = document.createElement('p')
    p.textContent = emptyMessage
    main.appendChild(p)
  } else {
    renderChain(main, blocks)
  }
}

const handleClickMine = async () => {
  const main = document.getElementsByTagName('main')[0]
  main.innerHTML = ''
  history.pushState({ page: 0 }, 'Mine for Currency', '/mine')
  const block = await proveWork()
  renderBlock(main, block)
}

const handleClickHome = () => {
  history.pushState({ page: 0 }, 'Nonfungible Blockchain Cryptocurrency', '/')
  const main = document.getElementsByTagName('main')[0]
  renderHome(main)
}

const handleClickWallet = async () => {
  const main = document.getElementsByTagName('main')[0]
  main.innerHTML = ''
  history.pushState({ page: 0 }, 'Your Wallet', '/wallet')
  const response = await fetchWallet(node)
  const { wallet } = await response.json()
  renderChain(main, wallet)
}

const renderBlock = (container, block) => {
  const sublist = document.createElement('ul')
  const index = document.createElement('li')
  const token = document.createElement('li')
  const owner = document.createElement('li')
  const timestamp = document.createElement('li')
  index.textContent = `Index: ${block.index}`
  token.textContent = `Token: ${block.data.token}`
  owner.textContent = `Owner: ${block.owner}`
  const date = new Date(block.timestamp)
  timestamp.textContent = `Mined: ${date.toLocaleTimeString()} ${date.toLocaleDateString()}`
  sublist.appendChild(index)
  sublist.appendChild(token)
  sublist.appendChild(owner)
  sublist.appendChild(timestamp)
  container.appendChild(sublist)
}

const renderChain = (container, blocks) => {
  const list = document.createElement('ol')
  blocks.forEach((block) => {
    const item = document.createElement('li')
    renderBlock(item, block)
    list.appendChild(item)
  })
  container.appendChild(list)
}

const renderHome = (container) => {
  container.innerHTML = ''
}

const renderNav = (container) => {
  const nav = document.createElement('nav')
  const links = document.createElement('ul')
  const home = {
    url: '/',
    title: 'Home',
    clickHandler: handleClickHome
  }

  const chain = {
    url: '/chain',
    title: 'View Entire Blockchain',
    clickHandler: handleClickChain
  }

  const mine = {
    url: '/mine',
    title: 'Mine for Blocks',
    clickHandler: handleClickMine
  }

  const wallet = {
    url: '/wallet',
    title: 'View Your Wallet',
    clickHandler: handleClickWallet
  }

  const navLinks = [
    home,
    chain,
    mine,
    wallet
  ]

  navLinks.forEach(({ title: titleText, clickHandler }) => {
    const listItem = document.createElement('li')
    const anchor = document.createElement('a')
    anchor.addEventListener('click', clickHandler)
    const title = document.createAttribute('title')
    title.value = titleText
    anchor.setAttributeNode(title)
    anchor.textContent = titleText.toLocaleUpperCase()
    listItem.appendChild(anchor)
    links.appendChild(listItem)
  })
  nav.appendChild(links)
  container.appendChild(nav)
}

const buildUi = () => {
  const header = document.getElementsByTagName('header')[0]
  renderNav(header)
}

const init = async (mainContainer) => {
  await getAndStoreFingerprint()
  buildUi()
}

window.onload = async () => {
  const fingerprint = window.localStorage.getItem('node')
  const main = document.getElementsByTagName('main')[0]
  if (fingerprint) {
    node = fingerprint
    init()
  } else {
    const generating = document.createElement('h1')
    generating.textContent = GENERATING_FINGERPRINT
    main.appendChild(generating)
    setTimeout(async () => {
      await init()
      generating.textContent = `${generating.textContent} ${node}`
    }, 500)
  }


}
