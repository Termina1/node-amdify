through = require 'through'
detective = require 'detective'
path = require 'path'
amdify =
  wrapCode: ({resolvedVars, resolvedModules, moduleName, code}) ->
    resolvedModules = ['module', 'exports', 'require'].concat resolvedModules
    resolvedVars = ['module', 'exports', 'require']
    code = "define('#{moduleName}', [#{resolvedModules.map((el) -> "'#{el}'").join(', ')}], function(#{resolvedVars.join(', ')}) {\n" + code + "\n});\n";
    code

  normalizeCode: (code, resolved, resolvedModules) ->
    for el, i in resolved
      code = code.replace el, resolvedModules[i]
    code

  trackPaths: (baseDir, data) ->
    baseDir = path.resolve(baseDir)
    modulePath = path.relative baseDir, path.dirname data.file
    moduleName = path.join modulePath, path.basename data.file, path.extname data.file
    resolved = detective(data.code)
    code = data.code
    resolvedModules = resolved.map (el) -> 
      if el and el.match(/^(.\/|..\/)/)
        path.normalize path.relative baseDir, path.join baseDir, modulePath, el
      else
        el
    code = @normalizeCode code, resolved, resolvedModules
    resolvedModules: resolvedModules, moduleName: moduleName, code: code

  getPipe: (baseDir) ->
    self = @
    through (data) ->
      if data is 'compiled'
        @queue data
      else
        result = self.trackPaths baseDir, data
        wrappedCode = self.wrapCode result
        @queue code: wrappedCode, module: result.moduleName, deps: result.resolvedModules

module.exports = amdify
