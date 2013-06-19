amdify = require('./src/main')
fs = require 'fs'
{spawn, exec} = require('child_process')

TEST_COMMAND = "#{__dirname}/node_modules/mocha/bin/mocha"

task 'watch', ->
  converter = amdify.watch './src', './package.js', './lib'
  converter.launchPipe -> console.log 'compiled'

task 'build', ->
  converter = amdify.build './src', './package.js', './lib'
  converter.launchPipe -> console.log 'compiled'

launch = (cmd, options=[], callback) ->
  app = spawn cmd, options
  app.stdout.pipe(process.stdout, end: false)
  app.stderr.pipe(process.stderr)
  app.on 'exit', (status) -> callback?() if status is 0

mocha = (options, callback) ->
  if typeof options is 'function'
    callback = options
    options = []

  if typeof options is 'string'
    options = options.split " "

  files = []
  finder = require('findit').find './test'
  finder.on 'file', (file) -> files.push file if file.slice(-6) is 'coffee'
  finder.on 'end', ->
    options = options.concat files
    launch TEST_COMMAND, options, callback

task 'test', 'Run tests', -> mocha([])
task 'test-watch', 'Run tests on every file change', -> mocha ["-w"]
