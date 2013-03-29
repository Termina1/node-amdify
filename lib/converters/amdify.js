(function() {
  var detective, path, through, trackPaths, wrapCode;

  through = require('through');

  detective = require('detective');

  path = require('path');

  wrapCode = function(data, _arg) {
    var base, code, resolved, resolvedModules, resolvedVars;

    resolved = _arg.resolved, resolvedModules = _arg.resolvedModules, base = _arg.base;
    resolvedModules = ['module', 'exports', 'require'].concat(resolvedModules);
    resolvedVars = ['module', 'exports', 'require'].concat(resolved.map(function(el) {
      return el.variable;
    }));
    code = ("define('" + base + "', [" + (resolvedModules.map(function(el) {
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
      moduleName: name,
      base: base
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
