(function() {
  var Pipe, amdify, fast, optimize;

  fast = require('coffee-fast-compile');

  amdify = require('./converters/amdify').getPipe;

  optimize = require('./converters/optimize');

  Pipe = (function() {
    function Pipe(dir, output, pack) {
      this.dir = dir;
      this.output = output;
      this.pack = pack;
    }

    Pipe.prototype.launchPipe = function(userPipe, cb) {
      var amdifyPipe, coffeePipe, optimizePipe, pipe, pipes;

      amdifyPipe = amdify(this.dir);
      optimizePipe = optimize(this.pack, this.cb);
      coffeePipe = fast.watch(this.dir, this.output);
      pipes = [coffeePipe, userPipe, amdifyPipe, optimizePipe].compact();
      pipe = pipes.shift();
      return pipes.each(function(el) {
        return pipe = pipe.pipe(el);
      });
    };

    return Pipe;

  })();

  module.exports = {
    watch: function(dir, output, pack, cb, userPipe) {
      var pipe;

      pipe = new Pipe(dir, output, pack);
      return pipe.launchPipe(userPipe, cb);
    }
  };

}).call(this);
