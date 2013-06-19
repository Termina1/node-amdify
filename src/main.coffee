fast = require 'coffee-fast-compile'
amdify = require('./converters/amdify')
optimize = require './converters/optimize'

class Pipe

  constructor: (@dir, @pack, @output, @watch = false) ->

  launchPipe: (cb, userPipe, userResultPipe) ->
    amdifyPipe = amdify.getPipe @dir
    optimizePipe = optimize @pack, cb
    coffeePipe = if @watch then fast.watch @dir, @output else fast.build @dir, @output
    pipes = [coffeePipe, userPipe, amdifyPipe, userResultPipe, optimizePipe].compact true
    pipe = pipes.shift()
    pipes.each (el) -> pipe = pipe.pipe el


module.exports =
  watch: (dir, pack, output) ->
    new Pipe(dir, pack, output, true)

  build: (dir, pack, output) ->
    new Pipe(dir, pack, output)