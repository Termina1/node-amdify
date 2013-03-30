fast = require 'coffee-fast-compile'
amdify = require('./converters/amdify').getPipe
optimize = require './converters/optimize'

process = (coffeeStream, pack, cb) ->
  amdifyPipe = amdify './src'
  optimizePipe = optimize pack, cb
  coffeeStream.pipe(amdifyPipe).pipe(optimizePipe)


module.exports = 
  watch: (dir, output, pack, cb) ->
    process fast.watch(dir, output), pack, cb