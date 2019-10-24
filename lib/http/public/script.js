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

const handleClickChain = async () => {
  history.pushState({ page: 0 }, chain.title, chain.url)
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

const renderChain = (container, blocks) => {
  const list = document.createElement('ol')
  blocks.forEach((block) => {
    console.log(block)
    const item = document.createElement('li')
    item.textContent = block
    list.appendChild(item)
  })
  container.appendChild(list)
}

const renderNav = (container) => {
  const nav = document.createElement('nav')
  const links = document.createElement('ol')
  const home = {
    url: '/',
    title: 'Home',
    clickHandler: () => {
      history.pushState({ page: 0 }, home.title, home.url)
    }
  }

  const chain = {
    url: '/chain',
    title: 'View Entire Blockchain',
    clickHandler: handleClickChain
  }

  const mine = {
    url: '/mine',
    title: 'Mine for Blocks',
    clickHandler: (event) => {
      history.pushState({ page: 0 }, mine.title, mine.url)
    }
  }

  const wallet = {
    url: '/wallet',
    title: 'View Your Wallet',
    clickHandler: (event) => {
      history.pushState({ page: 0 }, wallet.title, wallet.url)
    }
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
