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
