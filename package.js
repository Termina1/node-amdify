define('converters/optimize', ['module', 'exports', 'require', 'through', 'sugar', 'fs'], function(module, exports, require) {
(function() {
  var buildPack, fs, getDeps, through;

  through = require('through');

  require('sugar');

  fs = require('fs');

  getDeps = function(module, deps, order) {
    var dep, moduleDeps, _i, _len;

    moduleDeps = deps[module];
    if (moduleDeps && order.indexOf(module) < 0) {
      for (_i = 0, _len = moduleDeps.length; _i < _len; _i++) {
        dep = moduleDeps[_i];
        if (!(order.indexOf(dep) < 0)) {
          continue;
        }
        order.push(dep);
        order = getDeps(dep, deps, order);
      }
    }
    return order;
  };

  buildPack = function(pack, deps, code, cb) {
    var gencode, module, modules, order, _i, _j, _len, _len1, _ref,
      _this = this;

    order = [];
    modules = Object.keys(deps);
    for (_i = 0, _len = modules.length; _i < _len; _i++) {
      module = modules[_i];
      order.push(module);
      order = getDeps(module, deps, order);
    }
    gencode = "";
    _ref = order.reverse();
    for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
      module = _ref[_j];
      gencode += code[module];
    }
    return fs.writeFile(pack, gencode, function() {
      return cb(pack);
    });
  };

  module.exports = function(pack, cb) {
    var code, dependencies;

    dependencies = {};
    code = {};
    return through(function(data) {
      var _name, _ref,
        _this = this;

      if (data === 'compiled') {
        this.pause();
        return buildPack(pack, dependencies, code, function() {
          _this.resume();
          if (typeof cb === 'function') {
            return cb();
          }
        });
      } else {
        code[data.module] = data.code;
        if ((_ref = dependencies[_name = data.module]) == null) {
          dependencies[_name] = [];
        }
        return dependencies[data.module] = dependencies[data.module].concat(data.deps).unique();
      }
    });
  };

}).call(this);

});
define('converters/amdify', ['module', 'exports', 'require', 'through', 'detective', 'path'], function(module, exports, require) {
(function() {
  var amdify, detective, path, through;

  through = require('through');

  detective = require('detective');

  path = require('path');

  amdify = {
    wrapCode: function(_arg) {
      var code, moduleName, resolvedModules, resolvedVars;

      resolvedVars = _arg.resolvedVars, resolvedModules = _arg.resolvedModules, moduleName = _arg.moduleName, code = _arg.code;
      resolvedModules = ['module', 'exports', 'require'].concat(resolvedModules);
      resolvedVars = ['module', 'exports', 'require'];
      code = ("define('" + moduleName + "', [" + (resolvedModules.map(function(el) {
        return "'" + el + "'";
      }).join(', ')) + "], function(" + (resolvedVars.join(', ')) + ") {\n") + code + "\n});\n";
      return code;
    },
    normalizeCode: function(code, resolved, resolvedModules) {
      var el, i, _i, _len;

      for (i = _i = 0, _len = resolved.length; _i < _len; i = ++_i) {
        el = resolved[i];
        code = code.replace(el, resolvedModules[i]);
      }
      return code;
    },
    trackPaths: function(baseDir, data) {
      var code, moduleName, modulePath, resolved, resolvedModules;

      baseDir = path.resolve(baseDir);
      modulePath = path.relative(baseDir, path.dirname(data.file));
      moduleName = path.join(modulePath, path.basename(data.file, path.extname(data.file)));
      resolved = detective(data.code);
      code = data.code;
      resolvedModules = resolved.map(function(el) {
        if (el && el.match(/^(.\/|..\/)/)) {
          return path.normalize(path.relative(baseDir, path.join(baseDir, modulePath, el)));
        } else {
          return el;
        }
      });
      code = this.normalizeCode(code, resolved, resolvedModules);
      return {
        resolvedModules: resolvedModules,
        moduleName: moduleName,
        code: code
      };
    },
    getPipe: function(baseDir) {
      var self;

      self = this;
      return through(function(data) {
        var result, wrappedCode;

        if (data === 'compiled') {
          return this.queue(data);
        } else {
          result = self.trackPaths(baseDir, data);
          wrappedCode = self.wrapCode(result);
          return this.queue({
            code: wrappedCode,
            module: result.moduleName,
            deps: result.resolvedModules
          });
        }
      });
    }
  };

  module.exports = amdify;

}).call(this);

});
define('main', ['module', 'exports', 'require', 'coffee-fast-compile', 'converters/amdify', 'converters/optimize'], function(module, exports, require) {
(function() {
  var Pipe, amdify, fast, optimize;

  fast = require('coffee-fast-compile');

  amdify = require('converters/amdify');

  optimize = require('converters/optimize');

  Pipe = (function() {
    function Pipe(dir, pack, output, watch) {
      this.dir = dir;
      this.pack = pack;
      this.output = output;
      this.watch = watch != null ? watch : false;
    }

    Pipe.prototype.launchPipe = function(cb, userPipe, userResultPipe) {
      var amdifyPipe, coffeePipe, optimizePipe, pipe, pipes;

      amdifyPipe = amdify.getPipe(this.dir);
      optimizePipe = optimize(this.pack, cb);
      coffeePipe = this.watch ? fast.watch(this.dir, this.output) : fast.build(this.dir, this.output);
      pipes = [coffeePipe, userPipe, amdifyPipe, userResultPipe, optimizePipe].compact(true);
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

});
