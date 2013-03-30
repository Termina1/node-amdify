(function() {
  var amdify, fast, optimize, process;

  fast = require('coffee-fast-compile');

  amdify = require('./converters/amdify').getPipe;

  optimize = require('./converters/optimize');

  process = function(coffeeStream, pack, cb) {
    var amdifyPipe, optimizePipe;

    amdifyPipe = amdify('./src');
    optimizePipe = optimize(pack, cb);
    return coffeeStream.pipe(amdifyPipe).pipe(optimizePipe);
  };

  module.exports = {
    watch: function(dir, output, pack, cb) {
      return process(fast.watch(dir, output), pack, cb);
    }
  };

}).call(this);
