through = require 'through'
detective = require 'detective'
path = require 'path'

wrapCode = (data, {resolved, resolvedModules, moduleName}) ->
  resolvedModules = ['module', 'exports', 'require'].concat resolvedModules
  resolvedVars = ['module', 'exports', 'require'].concat resolved.map (el) -> el.variable
  code = "define('#{moduleName}', [#{resolvedModules.map((el) -> "'#{el}'").join(', ')}], function(#{resolvedVars.join(', ')}) {\n" + data.code + "\n}";
  code

trackPaths = (baseDir, data) ->
  name = path.resolve(data.file).replace(baseDir, '').replace(/\.\w+$/, '')
  base = name.split('/').slice(0, -1).join('/')
  base = '.' unless base
  resolved = detective.find(data.code, includeLeft: true).strings.filter (el) -> el.module and el.module.substr(0, 2) is './'
  resolvedModules = resolved.map (resolve) -> path.resolve(baseDir + '/' + resolve.module).replace(baseDir, '')
  resolvedModules: resolvedModules, resolved: resolved, moduleName: name

module.exports = (baseDir) ->
  baseDir = path.resolve(baseDir) + '/'
  through (data) ->
    if data is 'compiled'
      @queue data
    else
      result = trackPaths baseDir, data
      wrappedCode = wrapCode data, result
      @queue code: wrappedCode, module: result.moduleName, deps: result.resolvedModules
