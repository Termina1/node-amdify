through = require 'through'
detective = require 'detective'
path = require 'path'

wrapCode = (data, {resolvedVars, resolvedModules, moduleName, code}) ->
  resolvedModules = ['module', 'exports', 'require'].concat resolvedModules
  resolvedVars = ['module', 'exports', 'require']
  code = "define('#{moduleName}', [#{resolvedModules.map((el) -> "'#{el}'").join(', ')}], function(#{resolvedVars.join(', ')}) {\n" + code + "\n});\n";
  code



trackPaths = (baseDir, data) ->
  baseDir = path.resolve(baseDir)
  modulePath = path.relative baseDir, path.dirname data.file
  moduleName = path.join modulePath, path.basename data.file, path.extname data.file
  resolved = detective(data.code).filter (el) -> el and el.match(/^(.\/|..\/)/)
  code = data.code
  resolvedModules = resolved.map (el) -> path.normalize path.relative baseDir, path.join baseDir, modulePath, el
  for el, i in resolved
    code = code.replace el, resolvedModules[i]
  resolvedModules: resolvedModules, moduleName: moduleName, code: code

module.exports = 
  getPipe: (baseDir) ->
    through (data) ->
      if data is 'compiled'
        @queue data
      else
        result = trackPaths baseDir, data
        wrappedCode = wrapCode data, result
        @queue code: wrappedCode, module: result.moduleName, deps: result.resolvedModules

  trackPaths: trackPaths,

  wrapCode: wrapCode