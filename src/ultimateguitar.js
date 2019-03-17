import {cleanBody, buildFlow} from './utils'

function getMeta(getElement, key) {
  // labels exist in the mobile version
  const labels = Array.from(getElement('.label'))
    .filter(t => t.innerText.trim().match(new RegExp(key, 'i')))

  if (labels.length > 1) {
    throw new Error(`Too many labels for ${key}`)
  }

  if (labels.length == 1) {
    return labels[0].nextElementSibling.innerText
  }

  // desktop version just uses divs with both the key and value in the
  // same span
  const regex = new RegExp("^" + key + ": ([^\n]*)$", 'i')
  const divs = Array.from(document.querySelectorAll('div'))
    .map(d => d.innerText.match(regex))
    .filter(m => m)

  return divs.length > 0 ? divs[0][1] : null
}

function getSingle(getElement, tag) {
  const tags = getElement(tag)
  if (tags.length !== 1) {
    throw new Error(`invalid number of ${tag} tags ${tags.length}`)
  }
  return tags[0]
}

function getArtistFromLinks(getElement) {
  const artistLinks = Array.from(document.querySelectorAll('a'))
    .filter(a => a.href.match(/\/artist\//))
  return artistLinks.length > 0 ? artistLinks[0].innerText.trim() : null
}


function getFirst(elements, ...path) {
  for (const part of path) {
    elements = elements.map(s => s[part]).filter(x => x)
  }
  return elements.length > 0 ? elements[0] : null
}

const getSongFromHeader = (getElement) =>
  getSingle(getElement, 'h1').innerText.match(/(.*) Chords/i)[1]

function getBpm(getElement) {
  const bpmFields = getElement('[data-bpm]')
  if (bpmFields.length > 0) {
    return parseInt(bpmFields[0].dataset.bpm)
  }

  const bpmsFromHeaders = Array.from(getElement("header span"))
    .map(h => h.innerText.trim())
    .map(h => h.match(/^([0-9]+) bpm$/i))
    .filter(x => x)
    .map(m => parseInt(m[1]))

  return bpmsFromHeaders.length > 0
    ? bpmsFromHeaders[0]
    : null
}

function getTab(getElement) {
  const dirtyTab = getSingle(getElement, 'pre').textContent
  return cleanBody(dirtyTab)
}

function getCapo(getElement) {
  const dirtyCapo = getMeta(getElement, 'Capo')
  return dirtyCapo ? parseInt(dirtyCapo.replace(/[^0-9]/g, '')) : null
}

export function buildFile(getElement) {
  const schemas = Array.from(getElement('script[type="application/ld+json"]'))
    .map(s => JSON.parse(s.innerText))

  const song = getFirst(schemas, "name") || getSongFromHeader(getElement)
  const artist = getFirst(schemas, "byArtist.name") || getArtistFromLinks(getElement)
  const tab = getTab(getElement)
  const capo = getCapo(getElement) || ''
  const key = getMeta(getElement, 'Key')
  const bpm = getBpm(getElement)

  const flow = buildFlow(tab)

  return [
    song,
    artist,
    key ? `Key: ${key}` : null,
    bpm ? `Tempo: ${bpm}` : null,
    `Capo: ${capo}`,
    flow,
    '',
    tab
  ].filter(l => l !== null).join('\n')
}
