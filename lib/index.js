#!/usr/bin/env node
const {main} = require('./main')
main().catch(err => {
  console.error(err)
  process.exitCode = 1
})
