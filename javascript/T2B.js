/* global goTaps, YT, player */

import { State } from './state.js'
import { Slider } from './slider.js'
import { initialiseComboBox } from './combobox.js'

export const state = new State()

const local = {
  loopTimer: 0,
  delayTimer: 0,
  loaded: false,
  looping: false,
  start: null,
  end: null,
  taps: {
    duration: 0,
    taps: [],
    current: [],
    beats: null
  }
}

export function onAccept (event) {
  state.acceptCookies()

  const footer = document.querySelector('footer')
  if (footer) {
    if (state.global.hideCookiesMessage) {
      footer.style.visibility = 'hidden'
    } else {
      footer.style.visibility = 'visible'
    }
  }
}

export function onPlayerReady (event) {
  document.getElementById('file').style.visibility = 'visible'
  document.getElementById('url').readOnly = false

  local.start = new Slider('start', 'from', onSetStart)
  local.end = new Slider('end', 'to', onSetEnd)
  local.end.init(0, 100, 100)
}

export function onPlayerStateChange (event) {
  clearInterval(local.loopTimer)

  switch (event.data) {
    case YT.PlayerState.ENDED:
      if (!local.loaded) {
        local.loaded = true
        const duration = player.getDuration()
        const vid = getPlayerVideoID()

        local.start.init(0, duration, 0)
        local.end.init(0, duration, duration)
        local.taps.duration = duration

        state.addVideo(vid)
        lookup(state.T2B.apikey, vid)

        cue(false)
        drawSlider()
      }
      break

    case YT.PlayerState.PLAYING:
      if (local.loaded) {
        local.loopTimer = setInterval(tick, 100)
        document.getElementById('help').focus()
        document.getElementById('help').dataset.state = 'playing'
        draw()
      }
      break

    case YT.PlayerState.PAUSED:
      document.getElementById('help').dataset.state = 'cued'
      break

    case YT.PlayerState.BUFFERING:
      break

    case YT.PlayerState.CUED:
      document.getElementById('loading').style.visibility = 'hidden'
      document.getElementById('windmill').style.display = 'none'
      document.getElementById('player').classList.remove('hidden')

      document.getElementById('controls').style.visibility = 'visible'
      document.getElementById('taps').style.display = 'block'
      document.getElementById('taps').style.visibility = 'visible'

      document.getElementById('help').style.display = 'block'
      document.getElementById('help').style.visibility = 'visible'
      document.getElementById('help').dataset.state = 'cued'
      document.getElementById('help').focus()

      react()
      player.unMute()

      if (local.taps.current.length > 0) {
        local.taps.taps.push(local.taps.current)
        local.taps.current = []
        analyse()
        react()
      }

      break
  }
}

export function onURL (event) {
  const url = document.getElementById('url').value
  const vid = getVideoID(url)

  if (event.type === 'keydown') {
    document.getElementById('url').title = 'YouTube URL'
  }

  if (vid !== '') {
    document.getElementById('load').disabled = false
  } else {
    document.getElementById('load').disabled = true
  }

  if (vid !== '' && event.type === 'keydown' && event.key === 'Enter') {
    onLoad(event)
  }
}

export function onLoad (event) {
  const url = document.getElementById('url').value
  const vid = getVideoID(url)

  if (vid !== '') {
    clearTaps()
    local.loaded = false

    document.getElementById('loading').style.visibility = 'visible'
    document.getElementById('windmill').style.display = 'block'

    player.mute()
    player.loadVideoById({ videoId: vid, startSeconds: 0, endSeconds: 0.1 })
  }
}

export function setPickList () {
  const none = document.createElement('li')
  none.id = 'none'
  none.setAttribute('role', 'option')
  none.dataset.url = ''
  none.appendChild(document.createTextNode('(none)'))

  const items = [none]
  state.T2B.history.forEach(vid => {
    const li = document.createElement('li')
    let title = 'https://www.youtube.com/watch?v=' + vid

    if (state.T2B.titles.has(vid)) {
      title = state.T2B.titles.get(vid)
    }

    li.id = vid
    li.setAttribute('role', 'option')
    li.dataset.url = 'https://www.youtube.com/watch?v=' + vid
    li.appendChild(document.createTextNode(title))

    items.push(li)
  })

  const list = document.getElementById('cb1-listbox')
  const clone = list.cloneNode()

  clone.replaceChildren(...items)
  list.replaceWith(clone)
  initialiseComboBox('picklist')
}

function onSetStart (t, released) {
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
      break

    default:
      if (released && player.getCurrentTime() < t) {
        player.seekTo(t, true)
      }
  }

  if (released) {
    react()
  }

  drawSlider()
}

function onSetEnd (t, released) {
  document.getElementById('to').value = format(t)

  if (released) {
    switch (player.getPlayerState()) {
      case YT.PlayerState.ENDED:
      case YT.PlayerState.CUED:
        cue(false)
        break
    }

    react()
  }

  drawSlider()
}

function drawSlider () {
  const canvas = document.getElementById('controls').querySelector('div.slider div.rail canvas')
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  const t = player.getCurrentTime()
  const x = width * local.start.valueNow / local.taps.duration
  const w = width * local.end.valueNow / local.taps.duration

  ctx.clearRect(0, 0, width, height)

  ctx.fillStyle = '#268bd2c0'
  ctx.fillRect(x, 0, w - x + 1, height)

  if (t) {
    ctx.fillStyle = '#dc322fc0'
    ctx.fillRect(0, 0, Math.max(width * t / local.taps.duration, x), height)
  } else {
    ctx.fillStyle = '#dc322fc0'
    ctx.fillRect(0, 0, x, height)
  }
}

export function onLoop (event) {
  local.looping = event.target.checked
}

export function onKey (event) {
  if (local.loaded) {
    if (event.code === 'Space') {
      event.preventDefault()

      if (!event.repeat) {
        switch (player.getPlayerState()) {
          case YT.PlayerState.CUED:
          case YT.PlayerState.PAUSED:
            react()
            if ((local.end.valueNow - local.start.valueNow) > 1) {
              player.playVideo()
            }
            break

          case YT.PlayerState.PLAYING:
            local.taps.current.push(player.getCurrentTime())
            draw()
            break
        }
      }
    } else if (event.code === 'KeyS') {
      event.preventDefault()
      if (!event.repeat && player.getPlayerState() === YT.PlayerState.PLAYING) {
        cue(false)
      }
    } else if (event.code === 'KeyP') {
      event.preventDefault()
      if (!event.repeat && player.getPlayerState() === YT.PlayerState.PLAYING) {
        player.pauseVideo()
      }
    }
  }
}

export function onQuantize () {
  analyse()
}

export function onInterpolate () {
  analyse()
}

export function onClear (event) {
  clearTaps()
}

export function onExport (event) {
  let vid = getPlayerVideoID()
  if (vid === '') {
    vid = 'transcriptaze'
  }

  const object = {
    url: player.getVideoUrl(),
    title: '',
    duration: local.taps.duration,
    taps: local.taps.taps
  }

  if (state.T2B.titles.has(vid)) {
    object.title = state.T2B.titles.get(vid)
  }

  if (local.taps.beats != null) {
    object.beats = local.taps.beats
  }

  const blob = new Blob([JSON.stringify(object, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.getElementById('download')

  link.href = url
  link.download = vid + '.json'
  link.click()
}

export function onDoubleClick (event) {
  const apikey = document.getElementById('apikey')
  const style = window.getComputedStyle(apikey)

  if (style.display === 'none') {
    apikey.style.display = 'block'
  } else {
    apikey.style.display = 'none'
  }
}

function react () {
  const data = document.getElementById('data')

  if (local.loaded && (player.getPlayerState() === YT.PlayerState.CUED)) {
    data.style.visibility = 'visible'
  }

  if (local.taps.taps.length > 0) {
    document.querySelector('#all canvas.history').style.display = 'block'
  } else {
    document.querySelector('#all canvas.history').style.display = 'none'
  }

  if (local.taps.taps.length > 0 && local.taps.beats) {
    document.querySelector('#all canvas.beats').style.display = 'block'
    document.querySelector('#zoomed canvas.beats').style.display = 'block'
  } else {
    document.querySelector('#all canvas.beats').style.display = 'none'
    document.querySelector('#zoomed canvas.beats').style.display = 'none'
  }

  if (!local.taps.beats && local.taps.taps.length > 0) {
    document.getElementById('message').style.display = 'flex'
  } else {
    document.getElementById('message').style.display = 'none'
  }

  const w = (local.end.valueNow - local.start.valueNow) / local.taps.duration
  if (w && w < 0.75) {
    document.getElementById('zoomed').style.display = 'flex'
  } else {
    document.getElementById('zoomed').style.display = 'none'
  }

  if (local.taps.taps.length > 0) {
    data.querySelector('#export').disabled = false
    data.querySelector('#clear').disabled = false
    draw()
  }

  if (local.taps.beats != null) {
    drawBeats(local.taps.beats.beats)
  }
}

function clearTaps () {
  local.taps.duration = 0
  local.taps.taps = []
  local.taps.current = []

  react()
  draw()

  document.getElementById('bpm').value = ''
  document.getElementById('offset').value = ''
}

function cue (play) {
  const url = document.getElementById('url').value
  const vid = getVideoID(url)

  if (vid !== '') {
    const startAt = document.getElementById('start').getAttribute('valuenow')

    if (play) {
      player.loadVideoById({ videoId: vid, startSeconds: startAt })
    } else {
      player.mute()
      player.cueVideoById({ videoId: vid, startSeconds: startAt })
    }
  }
}

function tick () {
  const delay = parseFloat(document.getElementById('delay').value)
  const end = document.getElementById('end').getAttribute('valuenow')
  const t = player.getCurrentTime()

  if (t > end) {
    if (!isNaN(delay) && delay > 0) {
      cue(false)
      local.delayTimer = setInterval(delayed, delay * 1000)
    } else {
      cue(local.looping)
    }
  }

  drawSlider()
}

function delayed () {
  clearInterval(local.delayTimer)
  cue(local.looping)
}

function analyse () {
  if (local.taps.taps.flat().length > 0) {
    const quantize = document.getElementById('quantize').querySelector('input').checked
    const interpolate = document.getElementById('interpolate').querySelector('input').checked

    new Promise((resolve, reject) => {
      goTaps((obj, err) => {
        if (err) {
          reject(err)
        } else {
          resolve(obj)
        }
      }, local.taps.taps, local.taps.duration, quantize, interpolate)
    })
      .then(beats => {
        local.taps.beats = beats

        if (beats == null) {
          document.getElementById('bpm').value = ''
          document.getElementById('offset').value = ''
          document.getElementById('quantize').style.visibility = 'hidden'
          document.getElementById('quantize').querySelector('input').disabled = true
          document.getElementById('interpolate').style.visibility = 'hidden'
          document.getElementById('interpolate').querySelector('input').disabled = true
        } else {
          if (beats.BPM > 0) {
            document.getElementById('bpm').value = beats.BPM + ' BPM'
            document.getElementById('offset').value = Number.parseFloat(beats.offset).toFixed(2) + 's'
            document.getElementById('quantize').style.visibility = 'visible'
            document.getElementById('quantize').querySelector('input').disabled = false
            document.getElementById('interpolate').style.visibility = 'visible'
            document.getElementById('interpolate').querySelector('input').disabled = false
          } else {
            document.getElementById('bpm').value = ''
            document.getElementById('offset').value = ''
            document.getElementById('quantize').style.visibility = 'hidden'
            document.getElementById('quantize').querySelector('input').disabled = true
            document.getElementById('interpolate').style.visibility = 'hidden'
            document.getElementById('interpolate').querySelector('input').disabled = true
          }

          drawBeats(beats.beats)
          react()
        }
      })
      .catch(function (err) {
        console.log(err)
      })
  }
}

function draw () {
  const startAt = local.start.valueNow
  const playDuration = local.end.valueNow - local.start.valueNow
  const videoDuration = Math.floor(local.taps.duration)
  let list = local.taps.current

  if (player.getPlayerState() !== YT.PlayerState.PLAYING && local.taps.current.length === 0 && local.taps.taps.length > 0) {
    list = local.taps.taps[local.taps.taps.length - 1]
  }

  drawTaps(document.querySelector('#all canvas.current'), list, 0, videoDuration)
  drawTaps(document.querySelector('#all canvas.history'), local.taps.taps, 0, videoDuration)

  drawTaps(document.querySelector('#zoomed canvas.current'), list, startAt, playDuration)
  drawTaps(document.querySelector('#zoomed canvas.history'), local.taps.taps, startAt, playDuration)
}

function drawBeats (beats) {
  if (beats != null) {
    const startAt = local.start.valueNow
    const playDuration = local.end.valueNow - local.start.valueNow
    const videoDuration = Math.floor(local.taps.duration)
    const ticks = []

    beats.forEach(b => { ticks.push(b.at) })

    drawTaps(document.querySelector('#all canvas.beats'), ticks, 0, videoDuration)
    drawTaps(document.querySelector('#zoomed canvas.beats'), ticks, startAt, playDuration)
  }
}

function drawTaps (canvas, taps, offset, duration) {
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height

  ctx.lineWidth = 1
  ctx.strokeStyle = '#bc4f59'
  ctx.fillStyle = '#bc4f59'

  ctx.clearRect(0, 0, width, height)
  ctx.beginPath()
  taps.flat().forEach(function (t) {
    const x = Math.floor((t - offset) * width / duration) + 0.5

    ctx.moveTo(x - 3, height)
    ctx.lineTo(x, 0)
    ctx.lineTo(x + 3, height)
    ctx.fill()
  })
}

/* eslint prefer-regex-literals: 0 */
export function getVideoID (url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }

  try {
    const uri = new URL(url)
    const host = uri.host
    const origin = uri.origin
    const params = new URL(url).searchParams
    const pathname = uri.pathname
    const hash = uri.hash

    // www.youtube.com/watch?v=ZPIMomJP4kY'
    // www.youtube.com/watch?vi=ZPIMomJP4kY'

    if (params.has('v')) {
      return params.get('v')
    }

    if (params.has('vi')) {
      return params.get('vi')
    }

    // www.youtube.com/v/-wtIMTCHWuI
    // youtube.com/vi/oTJRivZTMLs
    // www.youtube.com/embed/nas1rJpm7wY
    // www.youtube.com/e/nas1rJpm7wY
    let match = new RegExp('/(?:embed|v|vi)/(.*?)(?:&.*)', 'i').exec(pathname)
    if (match !== null && match.length > 1) {
      return match[1]
    }

    match = new RegExp('/(?:embed|v|vi|e)/(.*)', 'i').exec(pathname)
    if (match !== null && match.length > 1) {
      return match[1]
    }

    // youtu.be/-wtIMTCHWuI
    match = new RegExp('/(.*?)(?:[&].*|$)', 'i').exec(pathname)
    if (host === 'youtu.be' && match !== null && match.length > 1) {
      return match[1]
    }

    //  www.youtube.com/user/IngridMichaelsonVEVO#p/a/u/1/QdK8U-VIH_o
    match = new RegExp('#p/(?:.*?)/[0-9]+/(.*?)(?:[?].*|$)', 'i').exec(hash)
    if (match !== null && match.length > 1) {
      return match[1]
    }

    // www.youtube.com/attribution_link?a=8g8kPrPIi-ecwIsS&u=/watch%3Fv%3DyZv2daTWRZU%26feature%3Dem-uploademail
    if (origin && pathname === '/attribution_link' && params.has('u')) {
      return getVideoID(new URL(params.get('u'), origin).toString())
    }

    // www.youtube.com/oembed?url=http%3A//www.youtube.com/watch?v%3D-wtIMTCHWuI&format=json
    if (pathname === '/oembed' && params.has('url')) {
      return getVideoID(params.get('url'))
    }
  } catch (err) {
  }

  return ''
}

function getPlayerVideoID () {
  try {
    const url = new URL(player.getVideoUrl())
    const vid = url.searchParams.get('v')
    if (vid != null) {
      return vid
    }
  } catch (err) {
    console.log(err)
  }

  return ''
}

function format (t) {
  let minutes = 0
  let seconds = 0

  if (t > 0) {
    minutes = Math.floor(t / 60)
    seconds = Math.round((t % 60) * 10) / 10.0
  }

  return String(minutes) + ':' + String(seconds).padStart(2, '0')
}

async function lookup (apikey, vid) {
  if (apikey !== '' || vid !== '') {
    const url = 'https://www.googleapis.com/youtube/v3/videos?part=snippet&id=' + vid.trim() + '&fields=items(id,snippet)&key=' + apikey
    const request = new Request(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      redirect: 'follow',
      referrerPolicy: 'no-referrer'
    })

    const get = fetch(request)
      .then(response => {
        if (response.ok) {
          return response.json()
        } else if (response.statusText !== '') {
          throw new Error('YouTube video title request failed (' + response.status + ' ' + response.statusText + ')')
        } else {
          throw new Error('YouTube video title request failed (' + response.status + ')')
        }
      }).then(object => {
        if (object.items.length > 0) {
          return object.items[0].snippet.title
        }

        return ''
      }).catch(err => {
        console.log(err.toString())
        return ''
      })

    const title = await get

    if (title.trim() !== '') {
      state.setVideoTitle(vid, title)
      setPickList()
    }
  }
}
