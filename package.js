define('main', ['module', 'exports', 'require', 'converters/amdify', 'converters/optimize'], function(module, exports, require) {
(function() {
  var amdify, fast, optimize, process;

  fast = require('coffee-fast-compile');

  amdify = require('converters/amdify').getPipe;

  optimize = require('converters/optimize');

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

}
define('converters/amdify', ['module', 'exports', 'require'], function(module, exports, require) {
(function() {
  var detective, path, through, trackPaths, wrapCode;

  through = require('through');

  detective = require('detective');

  path = require('path');

  wrapCode = function(data, _arg) {
    var code, moduleName, resolvedModules, resolvedVars;

    resolvedVars = _arg.resolvedVars, resolvedModules = _arg.resolvedModules, moduleName = _arg.moduleName, code = _arg.code;
    resolvedModules = ['module', 'exports', 'require'].concat(resolvedModules);
    resolvedVars = ['module', 'exports', 'require'];
    code = ("define('" + moduleName + "', [" + (resolvedModules.map(function(el) {
      return "'" + el + "'";
    }).join(', ')) + "], function(" + (resolvedVars.join(', ')) + ") {\n") + code + "\n}\n";
    return code;
  };

  trackPaths = function(baseDir, data) {
    var code, el, i, moduleName, modulePath, resolved, resolvedModules, _i, _len;

    baseDir = path.resolve(baseDir);
    modulePath = path.relative(baseDir, path.dirname(data.file));
    moduleName = path.join(modulePath, path.basename(data.file, path.extname(data.file)));
    resolved = detective(data.code).filter(function(el) {
      return el && el.match(/^(.\/|..\/)/);
    });
    code = data.code;
    resolvedModules = resolved.map(function(el) {
      return path.normalize(path.relative(baseDir, path.join(baseDir, modulePath, el)));
    });
    for (i = _i = 0, _len = resolved.length; _i < _len; i = ++_i) {
      el = resolved[i];
      code = code.replace(el, resolvedModules[i]);
    }
    return {
      resolvedModules: resolvedModules,
      moduleName: moduleName,
      code: code
    };
  };

  module.exports = {
    getPipe: function(baseDir) {
      return through(function(data) {
        var result, wrappedCode;

        if (data === 'compiled') {
          return this.queue(data);
        } else {
          result = trackPaths(baseDir, data);
          wrappedCode = wrapCode(data, result);
          return this.queue({
            code: wrappedCode,
            module: result.moduleName,
            deps: result.resolvedModules
          });
        }
      });
    },
    trackPaths: trackPaths,
    wrapCode: wrapCode
  };

}).call(this);

}
define('converters/optimize', ['module', 'exports', 'require'], function(module, exports, require) {
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
    var gencode, module, modules, order, _i, _j, _len, _len1,
      _this = this;

    order = [];
    modules = Object.keys(deps);
    for (_i = 0, _len = modules.length; _i < _len; _i++) {
      module = modules[_i];
      order.push(module);
      order = getDeps(module, deps, order);
    }
    gencode = "";
    for (_j = 0, _len1 = order.length; _j < _len1; _j++) {
      module = order[_j];
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

}
