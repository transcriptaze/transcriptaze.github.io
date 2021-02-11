'use strict';

var player
var loopTimer
var delayTimer
var loaded = false
var looping = false
var start
var end
var taps = {
  duration: 0,
  taps: [],
  current: []
}

document.addEventListener('keydown', event => {
  if (loaded) {
    onTap(event)
  }
})

function onPlayerReady(event) {
  document.getElementById('url').readOnly = false
  document.getElementById('load').disabled = false

  start = new Slider('start', 'from', onSetStart)
  end = new Slider('end', 'to', onSetEnd)
  end.init(0,100,100)
}

function onPlayerStateChange(event) {
  clearInterval(loopTimer)

  switch (event.data) {
    case YT.PlayerState.ENDED:
      if (!loaded) {
        loaded = true
        const duration = player.getDuration()

        start.init(0,duration,0)
        end.init(0,duration,duration)
        taps.duration = duration
        cue(false)
      }
      break

    case YT.PlayerState.PLAYING:
      if (loaded) {
        loopTimer = setInterval(tick, 100)        
        document.getElementById('help').focus()
        document.getElementById('help').dataset.state = 'playing'
      }
      break

    case YT.PlayerState.PAUSED:
      document.getElementById('help').dataset.state = 'cued'
      break

    case YT.PlayerState.BUFFERING:
      break

    case YT.PlayerState.CUED:
      document.getElementById('loading').style.visibility = 'hidden'
      document.getElementById('controls').style.visibility = 'visible'      
      document.getElementById('help').style.visibility = 'visible'      
      document.getElementById('taps').style.visibility = 'visible'      
      document.getElementById('export').style.visibility = 'visible'      
      document.getElementById('help').dataset.state = 'cued'
      document.getElementById('help').focus()
      player.unMute()

      if (taps.current.length > 0)  {
          taps.taps.push(taps.current)
          taps.current = []
          draw()
          analyse()
      }
      break
  }
}

function onSetStart(t, released) {
  document.getElementById('from').value = format(t)

  switch (player.getPlayerState()) {
    case YT.PlayerState.CUED:
    case YT.PlayerState.ENDED:
      if (released) {
        cue(false)
      }
      break

    case YT.PlayerState.PAUSED:
      player.seekTo(t, released)                              
      break;

    default:
      if (released && player.getCurrentTime() < t) {
          player.seekTo(t, true)                              
      }
    }
}

function onSetEnd(t, released) {
  document.getElementById('to').value = format(t)

  if (released) {
    switch (player.getPlayerState()) {
      case YT.PlayerState.ENDED:
      case YT.PlayerState.CUED:
        cue(false)
        break
    }    
  }
}

function onLoop(event) {
  looping = event.target.checked
}

function onTap(event) {
  if (event.code === 'Space') {
    event.preventDefault()

    if (!event.repeat) {
      switch (player.getPlayerState()) {
        case YT.PlayerState.CUED:
        case YT.PlayerState.PAUSED:
          player.playVideo()
          break

        case YT.PlayerState.PLAYING:
          taps.current.push(player.getCurrentTime())
          draw()
          break
      }
    }
  } else if (event.code === 'KeyS') {
    event.preventDefault()
    if (!event.repeat && player.getPlayerState() == YT.PlayerState.PLAYING) {
        cue(false)
    }
  } else if (event.code === 'KeyP') {
    event.preventDefault()
    if (!event.repeat && player.getPlayerState() == YT.PlayerState.PLAYING) {
        player.pauseVideo()
    }
  } 
}

function load(event) {
  const url = document.getElementById('url')    
  const vid = getVideoID(url.value)

  clearTaps(event)
  loaded = false

  document.getElementById('loading').style.visibility = 'visible'
  player.loadVideoById({ videoId: vid, startSeconds: 0, endSeconds: 0.1 })
}

function clearTaps(event) {
  document.getElementById('message').style.display = 'none'
  document.getElementById('beats').style.display = 'none'

  taps.duration = 0
  taps.taps = []
  taps.current = []

  drawTaps(document.querySelector('#current canvas.all'), taps.current, 0, taps.duration)
  drawTaps(document.querySelector('#current canvas.zoomed'), taps.current, start.valueNow, end.valueNow - start.valueNow)
  drawTaps(document.querySelector('#history canvas.all'), taps.taps, 0, taps.duration)    
  drawTaps(document.querySelector('#history canvas.zoomed'), taps.taps, start.valueNow, end.valueNow - start.valueNow)

  document.getElementById('bpm').value = ''
  document.getElementById('offset').value = ''
}

function cue(play) {
  const url = document.getElementById('url')    
  const vid = getVideoID(url.value)
  const start = document.getElementById('start').getAttribute('aria-valuenow')

  if (play) {
    player.loadVideoById({ videoId: vid, startSeconds: start })
  } else {
    player.mute()
    player.cueVideoById({ videoId: vid, startSeconds: start })
  }
}

function tick() {
  const delay = parseFloat(document.getElementById('delay').value)
  const end = document.getElementById('end').getAttribute('aria-valuenow')
  const t = player.getCurrentTime()

  if (t > end) {
    if (!isNaN(delay) && delay > 0) {
        cue(false)      
        delayTimer = setInterval(delayed, delay * 1000)
    } else {
        cue(looping)            
    }
  }
}

function delayed() {
  clearInterval(delayTimer)
  cue(looping)
}

function analyse () {
  if (taps.taps.flat().length > 0) {
      const quantize = document.getElementById('quantize').querySelector('input').checked
      const interpolate = document.getElementById('interpolate').querySelector('input').checked

      new Promise((resolve, reject) => {
        goTaps((obj, err) => {
          if (err) {
            reject(err)
          } else {
            resolve(obj)
          }
        }, taps.taps, taps.duration, quantize, interpolate)
      })
      .then(beats => { 
        if (beats == null) {
          document.getElementById('message').style.display = 'none'
          document.getElementById('beats').style.display = 'none'

          document.getElementById('bpm').value = ''
          document.getElementById('offset').value = ''
          document.getElementById('quantize').style.visibility = 'hidden'
          document.getElementById('quantize').querySelector("input").disabled = true
          document.getElementById('interpolate').style.visibility = 'hidden'
          document.getElementById('interpolate').querySelector("input").disabled = true
        } else {
          document.getElementById('message').style.display = 'none'
          document.getElementById('beats').style.display = 'block'

          if (beats.BPM > 0) {
            document.getElementById('bpm').value = beats.BPM + ' BPM'
            document.getElementById('offset').value = Number.parseFloat(beats.offset).toFixed(2) + 's'
            document.getElementById('quantize').style.visibility = 'visible'
            document.getElementById('quantize').querySelector("input").disabled = false
            document.getElementById('interpolate').style.visibility = 'visible'
            document.getElementById('interpolate').querySelector("input").disabled = false
          } else {
            document.getElementById('bpm').value = ''
            document.getElementById('offset').value = ''
            document.getElementById('quantize').style.visibility = 'hidden'
            document.getElementById('quantize').querySelector("input").disabled = true
            document.getElementById('interpolate').style.visibility = 'hidden'
            document.getElementById('interpolate').querySelector("input").disabled = true
          }

          drawBeats(beats.beats)
        }
      })
      .catch(function (err) { 
        console.log(err)
          document.getElementById('beats').style.display = 'none'
          document.getElementById('message').style.display = 'block'
          document.getElementById('message').querySelector('p').innerText = err.toString().toUpperCase()
      })
  }
}

function quantize () {
  analyse()
}

function interpolate () {
  analyse()
}

function draw() {
  if (player.getPlayerState() ===  YT.PlayerState.PLAYING) {
      drawTaps(document.querySelector('#current canvas.all'), taps.current, 0, taps.duration)
      drawTaps(document.querySelector('#current canvas.zoomed'), taps.current, start.valueNow, end.valueNow - start.valueNow)
  } else {
      drawTaps(document.querySelector('#history canvas.all'), taps.taps, 0, taps.duration)    
      drawTaps(document.querySelector('#history canvas.zoomed'), taps.taps, start.valueNow, end.valueNow - start.valueNow)
  }
}

function drawBeats (beats) {
  if (beats != null) {
      document.getElementById('message').style.display = 'none'
      document.getElementById('beats').style.display = 'block'

      let t = []
      
      beats.forEach(b => { t.push(b.at) })

      drawTaps(document.querySelector('#beats canvas.all'), t, 0, taps.duration)
      drawTaps(document.querySelector('#beats canvas.zoomed'), t, start.valueNow, end.valueNow - start.valueNow)
      return
  }

  document.getElementById('message').style.display = 'block'
  document.getElementById('beats').style.display = 'none'
}

function drawTaps(canvas, taps, offset, duration) {
  let ctx = canvas.getContext('2d')
  let width = canvas.width
  let height = canvas.height

  ctx.lineWidth = 1
  ctx.strokeStyle = 'red'

  ctx.clearRect(0, 0, width, height)
  ctx.beginPath()
  taps.flat().forEach(function(t) {
      let x = Math.floor((t - offset) * width/duration) + 0.5
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
  })
  ctx.stroke()
}

function getVideoID(url) {
  let addr = new URL(url)

  try {
    return addr.searchParams.get("v")
  } catch(err) {
    console.log(err)
  }

  return ""
}

