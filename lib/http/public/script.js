const INTERPUNCT = '・'
const FULL_WIDTH_SPACE = '　'
const FULL_WIDTH_COMMA = '，'

const invertColor = (hex, isBW) => {
  if (hex.indexOf('#') === 0) {
    hex = hex.slice(1)
  }
  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
    hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
  }
  if (hex.length !== 6) {
    return hex
  }
  var r = parseInt(hex.slice(0, 2), 16),
    g = parseInt(hex.slice(2, 4), 16),
    b = parseInt(hex.slice(4, 6), 16)
  if (isBW) {
    return (r * 0.299 + g * 0.587 + b * 0.114) > 186
      ? '#000000'
      : '#FFFFFF'
  }
  r = (255 - r).toString(16)
  g = (255 - g).toString(16)
  b = (255 - b).toString(16)
  return `#${r.padStart(2, '0')}${g.padStart(2, '0')}${b.padStart(2, '0')}`
}

const getKanjiName = (magicalGirl) => {
  const {
    name: {
      family: {
        kanji: family
      },
      given: {
        kanji: given
      }
    }
  } = magicalGirl
  return `${family}${INTERPUNCT}${given}`
}

const getKanjiPlace = (magicalGirl) => {
  const {
    homeTown: {
      city: {
        kanji: city
      },
      prefecture: {
        kanji: prefecture
      }
    }
  } = magicalGirl
  return `${city}${FULL_WIDTH_COMMA}${prefecture}`
}

const getRomajiName = (magicalGirl, isWestern = false) => {
  const {
    name: {
      family: {
        romaji: family
      },
      given: {
        romaji: given
      }
    }
  } = magicalGirl
  const first = isWestern ? given : family
  const last = isWestern ? family : given
  return `${first} ${last}`
}

const getRomajiPlace = (magicalGirl) => {
  const {
    homeTown: {
      city: {
        romaji: city
      },
      prefecture: {
        romaji: prefecture
      }
    }
  } = magicalGirl
  return `${city}, ${prefecture}`
}

const getFullName = (magicalGirl) => {
  return `${getKanjiName(magicalGirl)}${FULL_WIDTH_SPACE}${getRomajiName(magicalGirl)}`
}

const getHomeTown = (magicalGirl) => {
  return `${getKanjiPlace(magicalGirl)}${FULL_WIDTH_SPACE}${getRomajiPlace(magicalGirl)}`
}

const getMagicalGirl = async (id) => {
  const response = await fetch(`/api/v1/magicalgirl${id == 0 || id ? `/${id}` : ''}`)
  const jsonResponse = await response.json()
  return jsonResponse.magicalGirl
}

const renderMagicalGirlHeader = (magicalGirl) => {
  const { avatarURL } = magicalGirl
  const avatar = document.createElement('img')
  const title = document.createElement('h2')
  const subtitle = document.createElement('h3')
  const titleGroup = document.createElement('hgroup')
  const header = document.createElement('header')
  title.textContent = getKanjiName(magicalGirl)
  subtitle.textContent = getRomajiName(magicalGirl)
  avatar.src = avatarURL
  avatar.alt = getFullName(magicalGirl)
  titleGroup.appendChild(title)
  titleGroup.appendChild(subtitle)
  header.appendChild(titleGroup)
  header.appendChild(avatar)
  return header
}

const renderMagicalGirlMain = (magicalGirl) => {
  const name = getRomajiName(magicalGirl, true)
  const homeTown = getHomeTown(magicalGirl)
  const {
    age,
    birthDate,
    sign,
    zodiac,
    bloodType,
    height,
    weight,
    GPA,
    personality,
    measurements: {
      bust,
      waist,
      hips
    },
    planet,
    elements,
    stats: {
      Body,
      Mind,
      Spirit,
      Luck
    }
  } = magicalGirl
  const main = document.createElement('main')
  const birthday = new Date(birthDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })
  const lists = [
    [
      name,
      homeTown
    ],
    [
      `Age: ${age}`,
      `Birthday: ${birthday}`,
      `Height: ${height.toFixed(2)}cm`,
      `Weight: ${weight.toFixed(2)}kg`,
      `BWH: ${bust.toFixed(0)}-${waist.toFixed(0)}-${hips.toFixed(0)}`,
      `Blood Type: ${bloodType.type.name}${bloodType.rh.name}`,
      `Sign: ${sign.name}`,
      `Zodiac: ${zodiac.name}`,
      `Personality: ${personality.code}`,
      `GPA: ${GPA.toFixed(3)}`,
      `Planet: ${planet.name} ${planet.symbol}`,
      `Element${elements.length > 1 ? 's' : ''}: ${
      elements.length > 1 ? elements.map((element) => {
        return element.name
      }).join() : elements[0].name
      }`,
      `Body: ${Body}`,
      `Mind: ${Mind}`,
      `Spirit: ${Spirit}`,
      `Luck: ${Luck}`
    ]
  ]
  lists.forEach((list) => {
    const unorderedList = document.createElement('ul')
    list.forEach((field) => {
      const listItem = document.createElement('li')
      listItem.textContent = field
      unorderedList.appendChild(listItem)
    })
    main.appendChild(unorderedList)
  })
  return main
}

const renderMagicalGirl = (magicalGirl) => {
  const magicalGirlContainer = document.createElement('article')
  const renders = [
    renderMagicalGirlHeader(magicalGirl),
    renderMagicalGirlMain(magicalGirl)
  ]
  renders.forEach(element => {
    magicalGirlContainer.appendChild(element)
  })
  return magicalGirlContainer
}

window.onload = async () => {
  const main = document.getElementsByTagName('main')[0]
  const { pathname } = window.location
  const id = pathname.substring(1)
  let magicalGirl = null
  try {
    magicalGirl = await getMagicalGirl(id)
    const {
      zodiac,
      sign,
      bloodType,
      age
    } = magicalGirl
    const fullName = getFullName(magicalGirl)
    const title = `㊛${FULL_WIDTH_SPACE}${fullName} • ${zodiac.emoji}${sign.emoji}${bloodType.type.emoji}${
      age < 18 ? '🔞' : ''
      }`
    if (!id) {
      history.pushState({ page: 0 }, `${title}`, magicalGirl.id)
    }
    document.title = title
    document.body.style.backgroundColor = `#${magicalGirl.favoriteColor.hex}`
    main.appendChild(renderMagicalGirl(magicalGirl))
  } catch (error) {
    const hgroup = document.createElement('hgroup')
    const errorTitle = document.createElement('h2')
    errorTitle.textContent = `エラー${INTERPUNCT}ERROR`
    const errorSubtitle = document.createElement('h3')
    errorSubtitle.textContent = `すみません、10進数または16進数を入力してください。${INTERPUNCT}INPUT MUST BE A DECIMAL OR HEXADECIMAL NUMBER`
    hgroup.appendChild(errorTitle)
    hgroup.appendChild(errorSubtitle)
    main.appendChild(hgroup)
  }

  const links = [...document.getElementsByTagName('a'), ...document.getElementsByTagName('span')]
  if (magicalGirl) {
    links.forEach((link) => {
      link.style.color = invertColor(magicalGirl.favoriteColor.hex, true)
    })
  }
}
