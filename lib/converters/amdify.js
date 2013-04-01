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
    }).join(', ')) + "], function(" + (resolvedVars.join(', ')) + ") {\n") + code + "\n});\n";
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
