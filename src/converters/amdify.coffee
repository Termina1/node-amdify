through = require 'through'
detective = require 'detective'
path = require 'path'

wrapCode = (data, {resolvedVars, resolvedModules, moduleName}) ->
  resolvedModules = ['module', 'exports', 'require'].concat resolvedModules
  resolvedVars = ['module', 'exports', 'require'].concat resolvedVars
  code = "define('#{moduleName}', [#{resolvedModules.map((el) -> "'#{el}'").join(', ')}], function(#{resolvedVars.join(', ')}) {\n" + data.code + "\n}\n";
  code



trackPaths = (baseDir, data) ->
  baseDir = path.resolve(baseDir)
  modulePath = path.relative baseDir, path.dirname data.file
  moduleName = path.join modulePath, path.basename data.file, path.extname data.file
  resolved = detective.find(data.code, includeLeft: true).strings.filter (el) -> el.module and el.module.match(/^(.\/|..\/)/)
  resolvedModules = resolved.map (el) -> path.normalize path.relative baseDir, path.join baseDir, modulePath, el.module
  resolvedVars = resolved.map (el) -> el.variable
  resolvedModules: resolvedModules, moduleName: moduleName, resolvedVars: resolvedVars

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