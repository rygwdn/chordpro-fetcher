import {cleanBody, buildFlow} from './utils'

export function buildFile(data) {
  const artist = data.tab.artist_name
  const song = data.tab.song_name
  const key = data.tab.tonality_name
  const bpm = data.tab_view.strummings &&
    data.tab_view.strummings.length &&
    data.tab_view.strummings[0].bpm
  const tab = cleanBody(data.tab_view.wiki_tab.content.replace(/\[\/?ch\]/g, ""))
  const flow = buildFlow(tab)

  return [
    song,
    artist,
    key ? `Key: ${key}` : null,
    bpm ? `Tempo: ${bpm}` : null,
    'Capo:',
    flow,
    '',
    tab
  ].filter(l => l !== null).join('\n')
}
