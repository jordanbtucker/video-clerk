#!/usr/bin/env node
const App = require('./app')
const app = new App()
app.run().catch(err => {
  console.error(err)
  process.exitCode = 1
})
