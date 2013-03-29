define('converters/amdify', ['module', 'exports', 'require'], function(module, exports, require) {
(function() {
  var detective, path, through, trackPaths, wrapCode;

  through = require('through');

  detective = require('detective');

  path = require('path');

  wrapCode = function(data, _arg) {
    var code, moduleName, resolved, resolvedModules, resolvedVars;

    resolved = _arg.resolved, resolvedModules = _arg.resolvedModules, moduleName = _arg.moduleName;
    resolvedModules = ['module', 'exports', 'require'].concat(resolvedModules);
    resolvedVars = ['module', 'exports', 'require'].concat(resolved.map(function(el) {
      return el.variable;
    }));
    code = ("define('" + moduleName + "', [" + (resolvedModules.map(function(el) {
      return "'" + el + "'";
    }).join(', ')) + "], function(" + (resolvedVars.join(', ')) + ") {\n") + data.code + "\n}";
    return code;
  };

  trackPaths = function(baseDir, data) {
    var base, name, resolved, resolvedModules;

    name = path.resolve(data.file).replace(baseDir, '').replace(/\.\w+$/, '');
    base = name.split('/').slice(0, -1).join('/');
    if (!base) {
      base = '.';
    }
    resolved = detective.find(data.code, {
      includeLeft: true
    }).strings.filter(function(el) {
      return el.module && el.module.substr(0, 2) === './';
    });
    resolvedModules = resolved.map(function(resolve) {
      return path.resolve(baseDir + '/' + resolve.module).replace(baseDir, '');
    });
    return {
      resolvedModules: resolvedModules,
      resolved: resolved,
      moduleName: name
    };
  };

  module.exports = function(baseDir) {
    baseDir = path.resolve(baseDir) + '/';
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
  };

}).call(this);

}define('converters/optimize', ['module', 'exports', 'require'], function(module, exports, require) {
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

}define('main', ['module', 'exports', 'require', 'converters/amdify', 'converters/optimize'], function(module, exports, require, amdify, optimize) {
(function() {
  var amdify, fast, optimize, process;

  fast = require('coffee-fast-compile');

  amdify = require('./converters/amdify');

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