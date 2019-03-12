const onsongKeys = {
  'BPM': 'Tempo',
  'Original Key': 'Key',
  'CCLI': 'CCLI',
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

  return header.concat(fields)
}

async function getChordProContent(loadUrl, $) {
  const chordProUrl = $('.chord-pro-disp a[href*="DownLoadChordPro"]').prop('href')
  const chordProBody = await loadUrl(chordProUrl)
  return cleanBody(chordProBody)
}

function cleanBody(body) {
  let updatedBody = body.replace(
    /\[([^\]]+ [^\]]*)\]/gm, m =>
    '| ' + m.replace(/^[\[ |]*/, '').replace(/[\] |]*$/, '').split(' ').map(t => t.match(/[a-zA-Z]/) ? `[${t}]` : t).join(' ') + ' |'
  )

  for (const prt of ["Intro", "Verse", "Chorus", "Bridge", "Pre[- ]?Chorus", "Ending", "Outro", "Instrumental", "Interlude"]) {
    updatedBody = updatedBody.replace(new RegExp("^" + prt + "[ 0-9]*$", 'gim'), m => m.replace(/ +$/, '') + ":")
  }

  return updatedBody
}

exports.buildFile = async ($, loadUrl) => {
  const metadata = await getMetadata($)
  const chordProBody = await getChordProContent(loadUrl, $)

  return metadata.join("\n") + "\n" + "\n" + chordProBody
}
