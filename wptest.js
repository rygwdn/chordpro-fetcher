'use strict';

const { getPage } = require('./worshiptogether')

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

runTest()
