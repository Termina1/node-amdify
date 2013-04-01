fast = require 'coffee-fast-compile'
amdify = require('./converters/amdify').getPipe
optimize = require './converters/optimize'

class Pipe

  constructor: (@dir, @output, @pack) ->
    
  launchPipe: (userPipe, cb) ->
    amdifyPipe = amdify @dir
    optimizePipe = optimize @pack, @cb
    coffeePipe = fast.watch @dir, @output
    pipes = [coffeePipe, userPipe, amdifyPipe, optimizePipe].compact()
    pipe = pipes.shift()
    pipes.each (el) -> pipe = pipe.pipe el


module.exports = 
  watch: (dir, output, pack, cb, userPipe) ->
    pipe = new Pipe(dir, output, pack)
    pipe.launchPipe userPipe, cb