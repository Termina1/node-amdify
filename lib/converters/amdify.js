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
