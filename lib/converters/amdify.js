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
