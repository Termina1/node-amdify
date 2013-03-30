through = require 'through'
require('sugar')
fs = require('fs')

getDeps = (module, deps, order) ->
  moduleDeps = deps[module]
  if moduleDeps and order.indexOf(module) < 0
    for dep in moduleDeps when order.indexOf(dep) < 0
      order.push dep
      order = getDeps dep, deps, order
  order

buildPack = (pack, deps, code, cb) ->
  order = []
  modules = Object.keys deps
  for module in modules
    order.push module
    order = getDeps module, deps, order
  gencode = ""
  for module in order
    gencode += code[module]
  fs.writeFile pack, gencode, => cb pack

module.exports = (pack, cb) ->
  dependencies = {}
  code = {}
  through (data) ->
    if data is 'compiled'
      do @pause
      buildPack pack, dependencies, code, => 
        do @resume
        do cb if typeof cb is 'function'
    else
      code[data.module] = data.code
      dependencies[data.module] ?= []
      dependencies[data.module] = dependencies[data.module].concat(data.deps).unique()
