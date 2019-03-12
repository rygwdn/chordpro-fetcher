'use strict';

const rp = require('request-promise');
const cheerio = require('cheerio')
const url = require('url');

const onsongKeys = {
  'BPM': 'Tempo',
  'Original Key': 'Key',
  'CCLI': 'CCLI',
}

async function logIn(username, password) {
  if (!username || !password) {
    throw new Error("must provide username and password")
  }

  const loginUrl = 'https://www.worshiptogether.com/membership/log-in/'
  const loginPage = await rp(loginUrl)
  const $ = cheerio.load(loginPage)
  $('#loginModel_Username').val(username)
  $('#loginModel_Password').val(password)
  const form = $('form:has(#loginModel_Username)')

  const data = form.serializeArray()
  const postUrl = form.attr('action')

  const request = {
    method: 'POST',
    uri: url.resolve(loginUrl, postUrl),
    jar: true,
    followAllRedirects: true,
    form: data.reduce((f, t) => {
      f[t.name] = t.value
      return f
    }, {})
  }

  return await rp(request)
}

async function getMetadata($page) {
  const fields = Array.from($page('.detail'))
    .map(m => $page(m).children())
    .filter(c => c.length > 1)
    .map(c => [$page(c[0]).text().trim(), $page(c[1]).text().trim()])
    .map(([k, v]) => [k.replace(/(\(s\))?( #)?:$/g, ''), v])
    .filter(([k, v]) => Object.keys(onsongKeys).includes(k))
    .map(([k, v]) => `${onsongKeys[k]}: ${v}`)

  const header = $page('.t-song-details__marquee__copy')
    .text()
    .split('\n')
    .map(l => l.trim())
    .filter(s => s)

  return header.concat(fields)
}

async function getChordProContent(root, $page) {
  const chordProUrl = $page('.chord-pro-disp a[href*="DownLoadChordPro"]').prop('href')

  const chordProBody = await rp({
    uri: url.resolve(root, chordProUrl),
    jar: true,
  })

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

let didLogin = false;

async function getPage(url, username, password) {
  if (!didLogin) {
    await logIn(username || process.env.WT_USER, password || process.env.WT_PASS)
    didLogin = true
  }

  const $page = cheerio.load(await rp({
    uri: url,
    jar: true,
  }))

  const metadata = await getMetadata($page)
  const chordProBody = await getChordProContent(url, $page)

  const content = metadata.join("\n") + "\n" + "\n" + chordProBody
  return content
}

exports.getChordPro = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return
  }

  // Set CORS headers for the main request
  res.set('Access-Control-Allow-Origin', '*');

  const url = req.query.url;

  if (!url) {
    return res.send(
      'Please provide URL as GET parameter, for example: ?url=https://example.com'
    );
  }

  const pageData = await getPage(url, process.env.WT_USER, process.env.WT_PASS)
  res.set('Content-Type', 'text/plain');
  res.send(pageData);
};

function runTest() {
  const sampleUrl = 'https://www.worshiptogether.com/songs/heaven-fall-cody-carnes/'
  const username = process.argv[2]
  const password = process.argv[3]

  getPage(sampleUrl, username, password)
    .then((file) => {
      console.log(file)
      process.exit()
    })
    .catch(e => {
      console.error(e)
      process.exit(1)
    })
}

//runTest()
