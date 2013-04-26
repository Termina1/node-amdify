(function() {
  var Pipe, amdify, fast, optimize;

  fast = require('coffee-fast-compile');

  amdify = require('./converters/amdify').getPipe;

  optimize = require('./converters/optimize');

  Pipe = (function() {
    function Pipe(dir, pack, output, watch) {
      this.dir = dir;
      this.pack = pack;
      this.output = output;
      this.watch = watch != null ? watch : false;
    }

    Pipe.prototype.launchPipe = function(userPipe, cb) {
      var amdifyPipe, coffeePipe, optimizePipe, pipe, pipes;

      amdifyPipe = amdify(this.dir);
      optimizePipe = optimize(this.pack, cb);
      coffeePipe = this.watch ? fast.watch(this.dir, this.output) : fast.build(this.dir, this.output);
      pipes = [coffeePipe, userPipe, amdifyPipe, optimizePipe].compact(true);
      pipe = pipes.shift();
      return pipes.each(function(el) {
        return pipe = pipe.pipe(el);
      });
    };

    return Pipe;

  })();

  module.exports = {
    watch: function(dir, pack, output) {
      return new Pipe(dir, pack, output, true);
    },
    build: function(dir, pack, output) {
      return new Pipe(dir, pack, output);
    }
  };

}).call(this);
