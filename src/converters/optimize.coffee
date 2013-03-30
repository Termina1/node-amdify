through = require 'through'
require('sugar')
fs = require('fs')

getDeps = (module, deps) ->
  order = []
  moduleDeps = deps[module]
  unless moduleDeps
    []
  else
    for dep in moduleDeps
      order = order.concat getDeps dep, deps
      order.push dep
    order

buildPack = (pack, deps, code, cb) ->
  order = []
  for module, dep of deps when order.indexOf(module) < 0 
    order = order.concat getDeps module, deps
    if order.indexOf(module) >= 0 
      throw new Error('You have circular dependency!')
    else
      order.push module
  gencode = ""
  for module in order
    console.log module if typeof code[module] is 'undefined'
    gencode += code[module]
  fs.writeFile pack, gencode, => cb pack

module.exports = (pack) ->
  dependencies = {}
  code = {}
  through (data) ->
    if data is 'compiled'
      do @pause
      buildPack pack, dependencies, code, => do @resume
    else
      code[data.module] = data.code
      dependencies[data.module] ?= []
      dependencies[data.module] = dependencies[data.module].concat(data.deps).unique()
