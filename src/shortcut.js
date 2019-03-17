import * as wt from './worshiptogether'
import * as ug from './ultimateguitar'

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

export async function run(done) {
  done = done || completion
  try {
    done(await getFile())
  } catch (err) {
    done('ERROR: ' + err)
  }
}
