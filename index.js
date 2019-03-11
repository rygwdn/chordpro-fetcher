'use strict';

//const jsdom = require("jsdom");
const puppeteer = require('puppeteer');

let page;

const onsongKeys = {
  'BPM': 'Tempo',
  'Original Key': 'Key',
  'CCLI': 'CCLI',
}

async function logIn(username, password) {
  const browser = await puppeteer.launch({args: ['--no-sandbox']});
  page = await browser.newPage();

  await page.goto('https://www.worshiptogether.com/membership/log-in/')

  await page.evaluate(async (username, password) => {
    document.querySelector('#loginModel_Username').value = username
    document.querySelector('#loginModel_Password').value = password
  }, username, password)

  if (!username || !password) {
    throw new Error("must provide username and password")
  }

  await Promise.all([
    page.waitForNavigation(),
    page.click('button.submit'),
  ])

  return page
}

async function getMetadata(page) {
  const fields = await page.evaluate((onsongKeys) =>
    Array
    .from(document.querySelectorAll('.detail'))
    .filter(m => m.children.length > 1)
    .map(m => [m.children[0].innerText, m.children[1].innerText])
    .map(([k, v]) => [k.replace(/(\(s\))?( #)?:$/g, ''), v])
    .filter(([k, v]) => Object.keys(onsongKeys).includes(k))
    .map(([k, v]) => `${onsongKeys[k]}: ${v}`),
    onsongKeys)

  const header = await page.evaluate(() => document
    .querySelector('.t-song-details__marquee__copy')
    .innerText
    .split('\n')
    .filter(s => s))

  return header.concat(fields)
}

async function getChordPro(page) {
  const chordProBody = await page.evaluate(async () => {
    const chordProUrl = document.querySelector('.chord-pro-disp a[href*="DownLoadChordPro"]').href
    const response = await fetch(chordProUrl)
    return await response.text()
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

async function getPage(url) {
  if (!page) {
    page = await logIn(process.env.WT_USER, process.env.WT_PASS)
  }

  await page.goto(url);

  const metadata = await getMetadata(page)
  const chordProBody = await getChordPro(page)

  const content = metadata.join("\n") + "\n" + "\n" + chordProBody
  return content
}

exports.getChordPro = async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.send(
      'Please provide URL as GET parameter, for example: <a href="?url=https://example.com">?url=https://example.com</a>'
    );
  }

  const pageData = await getPage(url)
  res.set('Content-Type', 'text/plain');
  res.send(pageData);
};

function runTest() {
  const sampleUrl = 'https://www.worshiptogether.com/songs/heaven-fall-cody-carnes/'
  console.log(process.env)

  getPage(sampleUrl)
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
