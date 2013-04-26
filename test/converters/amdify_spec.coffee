amdify = require '../../src/converters/amdify'
fs = require 'fs'

testCode = fs.readFileSync('test/fixtures/source.js').toString()

resultCode = fs.readFileSync('test/fixtures/result.js').toString()

normalizeCode = fs.readFileSync('test/fixtures/normalized.js').toString()

testData = 
  code: testCode,
  file: "/Users/terminal/Work/node/node-amdify/src/more/main.coffee"

describe 'amdify', ->

  it "test path tracking", ->
    stub = sinon.stub amdify, 'normalizeCode'
    results = amdify.trackPaths "./src", testData
    results.should.eql 
      resolvedModules: ['coffee-fast-compile', 'more/converters/amdify', 'tested', 'more/converters/optimize']
      moduleName: 'more/main'
      code: results.code
    stub.called.should.be.true
    do stub.restore

  it "test path wrapCode", ->
    data = 
      resolvedModules: ['coffee-fast-compile', 'more/converters/amdify', 'tested', 'more/converters/optimize']
      moduleName: 'more/main'
      code: testCode
    results = amdify.wrapCode data
    results.should.eql resultCode

  it "normalizes code", ->
    resolved = ['coffee-fast-compile', './converters/amdify', '../tested', './converters/optimize']
    resolvedModules = ['coffee-fast-compile', 'more/converters/amdify', 'tested', 'more/converters/optimize']
    code = amdify.normalizeCode testCode, resolved, resolvedModules
    code.should.eql normalizeCode
      
