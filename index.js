'use strict';

const { getPage } = require('./worshiptogether')

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
