import {cleanBody, buildFlow} from './utils'

const onsongKeys = {
  'BPM': 'Tempo',
  'Original Key': 'Key',
  'CCLI': 'CCLI',
  'Theme': 'Topic',
  'Writer': '#Author',
}

async function getMetadata(getElement) {
  const fields = Array.from(getElement('.detail'))
    .map(m => Array.from(m.children))
    .filter(c => c.length > 1)
    .map(c => [c[0].textContent.trim(), c[1].textContent.trim()])
    .map(([k, v]) => [k.replace(/(\(s\))?( #)?:$/g, ''), v])
    .filter(([k, v]) => Object.keys(onsongKeys).includes(k))
    .map(([k, v]) => `${onsongKeys[k]}: ${v}`)

  const header = Array.from(getElement('.t-song-details__marquee__copy'))[0]
    .textContent
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

async function getChordProContent(loadUrl, getElement) {
  const chordProUrl = '' + Array.from(getElement('.chord-pro-disp a[href*="DownLoadChordPro"]'))[0].href
  const chordProBody = await loadUrl(chordProUrl)
  return cleanBody(chordProBody)
}

export async function buildFile(getElement, loadUrl) {
  const metadata = await getMetadata(getElement)
  const chordProBody = await getChordProContent(loadUrl, getElement)
  const flow = buildFlow(chordProBody)
  return metadata.concat([flow, "\n" + chordProBody]).join("\n")
}
