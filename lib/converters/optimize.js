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
