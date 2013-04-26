# node-amdify

This is yet another library that converts nodejs code to browser supported code. Actually, node-amdify doesn't know how
to extract pacakge dependencies, which makes it less usefull than https://github.com/substack/node-browserify. 
However, it serves to one more general purpose. It can convert CommonJS module definition style 
to AMD https://github.com/amdjs/amdjs-api/wiki/AMD.

I wrote it despite the fact that there is already https://github.com/jrburke/r.js, because r.js is very slow, 
not flexible and doesn't allow you to inject any code, that somehow modifies converter behaviour.

This library has only two methods:

## build
```js
amdify = require('node-amdify');

var pipe = amdify.build('dir', 'result', 'output')
```
Here ```dir``` is a directory from where all ```.js``` and ```.coffee``` file will be converted to AMD, ```result```
is a file where convert result will be stored and ```output``` is a directory where just compiled from coffee
but not converted files will be stored. Result value is ```Pipe``` class wich will be define later.

## watch

```js
amdify = require('node-amdify');

var pipe = amdify.build('dir', 'result', 'output')
```

The same as ```build``` but it also watches ```dir``` for changes and recompiles changed files. Since all compiled files
are stored in memory and ```watch``` compiles only changed files, after initial compilation, every change compiles 
very fast.

## Pipe

### constructor(dir, pack, output)

Just constructor, but since you have no access to a class, it doesn't matter.

### launchPipe(userPipe, cb)

node-amdify has 3 steps:
  1. Compile .coffee to .js if it's .coffee
  2. userPipe
  3. Extracting all CommonJS dependencies, normalizing paths and adding ```define``` statements
  4. Building single pack

```userPipe``` allows you to interact with this scheme and somehow modify code after it's compiled, but before convert started,
```cb``` is just a callback that fires every time when pack is built.

```coffee
through = require('through')

mypipe = through (data) ->
  if data.code
    code = 'var I18n = require("common/i18n");\n' + data.code
    @queue file: data.file, code: code
  else
    @queue data

module.exports =

  watch: ->
    converter = amdify.watch './src', './pack.js', './lib'
    converter.launchPipe mypipe, -> console.log 'compiled'
```
