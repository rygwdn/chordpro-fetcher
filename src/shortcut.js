import * as wt from './worshiptogether'
import * as ug from './ultimateguitar'

const EXPECTED_SHORTCUT_VERSION = 1
const GITHUB_URL = 'https://github.com/rygwdn/chordpro-fetcher'

const getElement = (s) => document.querySelectorAll(s)
const fetchUrl = async (url) => await (await fetch(url)).text()


async function getFromWT() {
  return await wt.buildFile(getElement, fetchUrl)
}

async function getFromUG() {
  return await ug.buildFile(getElement)
}

export async function getFile() {
  if (window.location.hostname.match(/\.ultimate-guitar\.com$/)) {
    return await getFromUG()
  }

  if (window.location.hostname.match(/\.worshiptogether\.com$/)) {
    return await getFromWT()
  }

  throw new Error('Unrecognized page')
}

export async function run(version) {
  if (version !== EXPECTED_SHORTCUT_VERSION) {
    completion({
      versionError: `There is an update to this shortcut. You are on version ${version}, but the current version is ${EXPECTED_SHORTCUT_VERSION}.`,
      url: GITHUB_URL,
    })
    return
  }

  try {
    const file = await getFile()
    completion({
      file: file,
      name: file.split('\n')[0],
    })
  } catch (err) {
    completion({
      error: '' + err
    })
  }
}
