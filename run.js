#!/usr/local/bin/node
require('@babel/polyfill')

const run = require('./src/index.js')

run().catch(err => {
  console.error(err)
})
