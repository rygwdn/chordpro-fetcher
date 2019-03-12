'use strict';

const rp = require('request-promise')
const cheerio = require('cheerio')
const url = require('url')
const { buildFile } = require('./wtparser')

const root = 'https://www.worshiptogether.com/'

async function loadUrl(path) {
  return await rp({
    uri: url.resolve(root, path),
    jar: true,
  })
}

async function logIn(username, password) {
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

  return await rp(request)
}

let didLogin = false;

exports.getPage = getPage
async function getPage(url, username, password) {
  if (!didLogin) {
    await logIn(username || process.env.WT_USER, password || process.env.WT_PASS)
    didLogin = true
  }

  const $ = cheerio.load(await loadUrl(url))

  return await buildFile($, loadUrl)
}

