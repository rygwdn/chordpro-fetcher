'use strict';

import * as rp from 'request-promise'
import * as cheerio from 'cheerio'
import * as url from 'url'
import * as { buildFile } from './wtparser'
import * as { getPage } from './worshiptogether'

const root = 'https://www.worshiptogether.com/'

// user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36
async function loadUrl(path) {
  return await rp({
    uri: url.resolve(root, path),
    jar: true,
  })
}

let didWpLogin = false;
async function wpLogIn(username, password) {
  if (didWpLogin) {
    return
  }

  if (!username || !password) {
    throw new Error("must provide username and password")
  }

  const loginUrl = 'https://www.worshiptogether.com/membership/log-in/'
  const loginPage = await loadUrl(loginUrl)
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

  await rp(request)
  didWpLogin = true
}

export async function getPage(url, username, password) {
  await wpLogIn(username || process.env.WT_USER, password || process.env.WT_PASS)

  const $ = cheerio.load(await loadUrl(url))

  return await buildFile($, loadUrl)
}


export async function getChordPro(req, res) {
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
}
