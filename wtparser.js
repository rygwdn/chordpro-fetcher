const _ = require('lodash')

const onsongKeys = {
  'BPM': 'Tempo',
  'Original Key': 'Key',
  'CCLI': 'CCLI',
  'Theme': 'Topic',
  'Writer': '#Author',
}

const songParts = [
  "Bridge",
  "Chorus",
  "Ending",
  "End Chord",
  "Instrumental",
  "Interlude",
  "Intro",
  "Outro",
  "Pre[- ]?Chorus",
  "Tag",
  "Turn",
  "Verse",
]

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

  // Force OnSong to use Capo 0
  const alwaysFields = ['Capo:']

  return header
    .concat(fields)
    .concat(alwaysFields)
    .map(line => line.replace(/ *, /g, '; '))
}

async function getChordProContent(loadUrl, $) {
  const chordProUrl = $('.chord-pro-disp a[href*="DownLoadChordPro"]').prop('href')
  const chordProBody = await loadUrl(chordProUrl)
  return cleanBody(chordProBody)
}

exports.buildFlow = buildFlow
function buildFlow(body) {
  const regex = new RegExp(
    "^(# REPEAT *)*"
    + "((" + songParts.join("|") + ")"
    + "[ 0-9]*):?"
    + "[\n# (]*(x *[0-9]*|[0-9] *x)?[)]?",
    'igm')

  // Find all the lines that match one of the song parts
  const flow = []
  let match
  while ((match = regex.exec(body)) !== null) {
    const repeat = match[4] ? parseInt(match[4].replace(/[ x]/gi, '')) : 1

    // Use the casing from the first occurrence (presumed to be the section heading)
    const part = match[2].trim().replace(/  /g, ' ').trim()
    const cleanPart = _.find(flow, (existing) => _.toLower(part) === _.toLower(existing)) || part

    for (let i = 0; i < repeat; i += 1) {
      flow.push(cleanPart)
    }
  }

  return "#Flow: " + flow.join(", ")
}

exports.cleanBody = cleanBody
function cleanBody(body) {
  // Remove leading whitespace
  let updatedBody = body.replace(/^ +/gm, '')
  updatedBody = updatedBody.replace(/] +/gm, '] ')

  // '[A B C]' => '| [A] [B] [C] |'
  updatedBody = updatedBody.replace(/\[([^\]]+ [^\]]*)\]/gm, m => {
    const withoutBrackets = m
      .replace(/^[\[ |]*/, '')
      .replace(/[\] |]*$/, '')

    const withNewBrackets = withoutBrackets
      .split(' ')
      .map(t => t.match(/[a-zA-Z]/) ? `[${t}]` : t)
      .join(' ')

    return `| ${withNewBrackets} |`
  })

  for (const prt of songParts) {
    // Bridge X3 => Bridge:\n# (x3)
    updatedBody = updatedBody.replace(new RegExp("^(" + prt + "[ 0-9]*) *(x[0-9])$", 'gim'), "$1\n# ($2)")

    // <part> <number> => <part> <number>:
    updatedBody = updatedBody.replace(new RegExp("^" + prt + "[ 0-9]*$", 'gim'), m => m.replace(/ +$/, '') + ":")

    // REPEAT CHORUS 3 => # REPEAT CHORUS 3
    updatedBody = updatedBody.replace(new RegExp("^repeat * " + prt, 'gim'), '# $&')
  }

  return updatedBody
}

exports.buildFile = async ($, loadUrl) => {
  const metadata = await getMetadata($)
  const chordProBody = await getChordProContent(loadUrl, $)
  const flow = buildFlow(chordProBody)

  return metadata.concat([flow, "\n" + chordProBody]).join("\n")
}
