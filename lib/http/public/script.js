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

const renderNav = (container) => {
  const nav = document.createElement('nav')
  const links = document.createElement('ol')
  const home = {
    url: '/',
    title: 'Home'
  }

  const chain = {
    url: '/chain',
    title: 'View Entire Blockchain'
  }

  const mine = {
    url: '/mine',
    title: 'Mine for Blocks'
  }

  const wallet = {
    url: '/wallet',
    title: 'View Your Wallet'
  }

  const navLinks = [
    home,
    chain,
    mine,
    wallet
  ]

  navLinks.forEach(({ url, title: titleText }) => {
    const listItem = document.createElement('li')
    const anchor = document.createElement('a')
    const href = document.createAttribute('href')
    href.value = url
    const title = document.createAttribute('title')
    title.value = titleText
    anchor.setAttributeNode(href)
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
    console.info(node)
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
