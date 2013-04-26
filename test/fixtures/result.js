define('more/main', ['module', 'exports', 'require', 'coffee-fast-compile', 'more/converters/amdify', 'tested', 'more/converters/optimize'], function(module, exports, require) {
(function() {
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

});
