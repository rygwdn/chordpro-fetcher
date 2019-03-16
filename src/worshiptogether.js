import {cleanBody, buildFlow} from './utils'

const onsongKeys = {
  'BPM': 'Tempo',
  'Original Key': 'Key',
  'CCLI': 'CCLI',
  'Theme': 'Topic',
  'Writer': '#Author',
}

async function getMetadata($) {
  const fields = Array.from($('.detail'))
    .map(m => $(m).children())
    .filter(c => c.length > 1)
    .map(c => [$(c[0]).text().trim(), $(c[1]).text().trim()])
    .map(([k, v]) => [k.replace(/(\(s\))?( #)?:$/g, ''), v])
    .filter(([k, v]) => Object.keys(onsongKeys).includes(k))
    .map(([k, v]) => `${onsongKeys[k]}: ${v}`)

  const header = $('.t-song-details__marquee__copy')
    .text()
    .split('\n')
    .map(l => l.trim())
    .filter(s => s)

  const title = header[0]
  const author = header[1]

  // Force OnSong to use Capo 0
  const alwaysFields = ['Capo:']

  const metadataLines = [author]
    .concat(fields)
    .concat(alwaysFields)
    .map(line => line.replace(/ *, /g, '; '))

  return [title].concat(metadataLines)
}

async function getChordProContent(loadUrl, $) {
  const chordProUrl = $('.chord-pro-disp a[href*="DownLoadChordPro"]').prop('href')
  const chordProBody = await loadUrl(chordProUrl)
  return cleanBody(chordProBody)
}

//exports.buildFile = buildFile
export async function buildFile($, loadUrl) {
  const metadata = await getMetadata($)
  const chordProBody = await getChordProContent(loadUrl, $)
  const flow = buildFlow(chordProBody)
  return metadata.concat([flow, "\n" + chordProBody]).join("\n")
}

// console.log(await buildFile($, async (url) => await (await fetch(url)).text()))
