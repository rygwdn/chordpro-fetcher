import * as wt from './worshiptogether'
import * as ug from './ultimateguitar'


export async function getFromWT() {
  return await wt.buildFile($, async (url) => await (await fetch(url)).text())
}

export async function getFromUG() {
  return await ug.buildFile(UGAPP.store.page.data)
}
