import * as wt from './worshiptogether'
import * as ug from './ultimateguitar'

async function getFromWT() {
  return await wt.buildFile($, async (url) => await (await fetch(url)).text())
}

async function getFromUG() {
  return await ug.buildFile(UGAPP.store.page.data)
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

export async function run() {
  getFile()
    .then(file => completion(file))
    .catch(err => completion('ERROR: ' + err))
}
