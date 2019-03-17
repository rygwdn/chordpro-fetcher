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

export function buildFile(getElement) {
  // TODO: cleanup with lodash?
  const schemas = Array.from(getElement('script[type="application/ld+json"]'))
    .map(s => JSON.parse(s.innerText))
  const namesFromSchema = schemas
    .map(s => s["name"])
    .filter(x => x)
  const artistsFromSchema = schemas
    .map(s => s["byArtist"])
    .filter(x => x)
    .map(s => s["name"])
    .filter(x => x)

  const song = namesFromSchema.length > 0
    ? namesFromSchema[0]
    : getSingle(getElement, 'h1').innerText.match(/(.*) Chords/i)[1]

  const artist = artistsFromSchema.length > 0
    ? artistsFromSchema[0]
    : getArtistFromLinks(getElement)

  // TODO: try to remove the extra newlines in the text
  const dirtyTab = getSingle(getElement, 'pre').innerText
  const tab = cleanBody(dirtyTab)

  const dirtyCapo = getMeta(getElement, 'Capo')
  const capo = dirtyCapo ? parseInt(dirtyCapo.replace(/[^0-9]/g, '')) : null

  const key = getMeta(getElement, 'Key')

  const bpmFields = getElement('[data-bpm]')
  const bpm = bpmFields.length > 0 ? parseInt(bpmFields[0].dataset.bpm) : null

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
