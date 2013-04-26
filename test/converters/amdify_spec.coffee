amdify = require '../../src/converters/amdify'

testCode = "(function() {
  var amdify, fast, optimize, process, tested;

  fast = require('coffee-fast-compile');

  amdify = require('./converters/amdify');

  tested = require('../tested');


  optimize = require('./converters/optimize');

  process = function(coffeeStream, pack) {
    var amdifyPipe, optimizePipe;

    amdifyPipe = amdify('./src');
    optimizePipe = optimize(pack);
    return coffeeStream.pipe(amdifyPipe).pipe(optimizePipe);
  };

  module.exports = {
    watch: function(dir, output, pack) {
      return process(fast.watch(dir, output), pack);
    }
  };

}).call(this);
"

testData = 
  code: testCode,
  file: "/Users/terminal/Work/node/node-amdify/src/more/main.coffee"

describe 'amdify', ->

  it "test path tracking", ->
    results = amdify.trackPaths "./src", testData
    results.should.eql 
      resolvedModules: ['coffee-fast-compile', 'more/converters/amdify', 'tested', 'more/converters/optimize']
      moduleName: 'more/main'
      code: results.code
