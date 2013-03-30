undefineddefine('main', ['module', 'exports', 'require', 'converters/optimize'], function(module, exports, require, optimize) {
(function() {
  var amdify, fast, optimize, process;

  fast = require('coffee-fast-compile');

  amdify = require('./converters/amdify').getPipe;

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

}
define('convertersamdify', ['module', 'exports', 'require'], function(module, exports, require) {
(function() {
  var detective, path, through, trackPaths, wrapCode;

  through = require('through');

  detective = require('detective');

  path = require('path');

  wrapCode = function(data, _arg) {
    var code, moduleName, resolvedModules, resolvedVars;

    resolvedVars = _arg.resolvedVars, resolvedModules = _arg.resolvedModules, moduleName = _arg.moduleName;
    resolvedModules = ['module', 'exports', 'require'].concat(resolvedModules);
    resolvedVars = ['module', 'exports', 'require'].concat(resolvedVars);
    code = ("define('" + moduleName + "', [" + (resolvedModules.map(function(el) {
      return "'" + el + "'";
    }).join(', ')) + "], function(" + (resolvedVars.join(', ')) + ") {\n") + data.code + "\n}\n";
    return code;
  };

  trackPaths = function(baseDir, data) {
    var moduleName, modulePath, resolved, resolvedModules, resolvedVars;

    baseDir = path.resolve(baseDir);
    modulePath = path.relative(baseDir, path.dirname(data.file));
    moduleName = modulePath + path.basename(data.file, path.extname(data.file));
    resolved = detective.find(data.code, {
      includeLeft: true
    }).strings.filter(function(el) {
      return el.module && el.module.match(/^(.\/|..\/)/);
    });
    resolvedModules = resolved.map(function(el) {
      return path.normalize(path.relative(baseDir, baseDir + modulePath + '/' + el.module));
    });
    resolvedVars = resolved.map(function(el) {
      return el.variable;
    });
    return {
      resolvedModules: resolvedModules,
      moduleName: moduleName,
      resolvedVars: resolvedVars
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
define('convertersoptimize', ['module', 'exports', 'require'], function(module, exports, require) {
(function() {
  var buildPack, fs, getDeps, through;

  through = require('through');

  require('sugar');

  fs = require('fs');

  getDeps = function(module, deps) {
    var dep, moduleDeps, order, _i, _len;

    order = [];
    moduleDeps = deps[module];
    if (!moduleDeps) {
      return [];
    } else {
      for (_i = 0, _len = moduleDeps.length; _i < _len; _i++) {
        dep = moduleDeps[_i];
        order = order.concat(getDeps(dep, deps));
        order.push(dep);
      }
      return order;
    }
  };

  buildPack = function(pack, deps, code, cb) {
    var dep, gencode, module, order, _i, _len,
      _this = this;

    order = [];
    for (module in deps) {
      dep = deps[module];
      if (!(order.indexOf(module) < 0)) {
        continue;
      }
      order = order.concat(getDeps(module, deps));
      if (order.indexOf(module) >= 0) {
        throw new Error('You have circular dependency!');
      } else {
        order.push(module);
      }
    }
    gencode = "";
    for (_i = 0, _len = order.length; _i < _len; _i++) {
      module = order[_i];
      if (typeof code[module] === 'undefined') {
        console.log(module);
      }
      gencode += code[module];
    }
    return fs.writeFile(pack, gencode, function() {
      return cb(pack);
    });
  };

  module.exports = function(pack) {
    var code, dependencies;

    dependencies = {};
    code = {};
    return through(function(data) {
      var _name, _ref,
        _this = this;

      if (data === 'compiled') {
        this.pause();
        return buildPack(pack, dependencies, code, function() {
          return _this.resume();
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
