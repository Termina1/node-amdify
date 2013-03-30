fast = require 'coffee-fast-compile'
amdify = require('./converters/amdify').getPipe
optimize = require './converters/optimize'

process = (coffeeStream, pack) ->
  amdifyPipe = amdify './src'
  optimizePipe = optimize pack
  coffeeStream.pipe(amdifyPipe).pipe(optimizePipe)


module.exports = 
  watch: (dir, output, pack) ->
    process fast.watch(dir, output), pack