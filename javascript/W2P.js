/* global goAudio, goRender, goClear, goSelect ,
          goSize, goCustomSize,
          goPalette, goFill,
          goGrid, goPadding, goAntialias, goScale */

import { State } from './state.js'
import { Slider } from './slider.js'

const state = new State()
const local = {}

let loading = false
let loaded = false

export function initialise () {
  loaded = false

  state.restore('W2P')

  // ... initialise size
  document.getElementById('custom').value = state.W2P.customSize

  const element = document.querySelector(`input[name="size"][value="${state.W2P.size}"]`)
  if (element) {
    element.checked = true
  }

  // ... initialise palettes
  for (let ix = 2; ix <= 6; ix++) {
    const tag = `palette${ix}`
    const input = document.getElementById(tag)
    const slot = document.querySelector(`img[data-palette="${tag}"]`)
    const bytes = state.W2P.palette.palettes.get(tag)

    if (bytes) {
      const array = new Uint8Array(bytes)
      const png = new Blob([array], { type: 'image/png' })
      const url = slot.src

      slot.src = URL.createObjectURL(png)
      input.disabled = false

      if (url) {
        URL.revokeObjectURL(url)
      }
    }
  }

  const tag = state.W2P.palette.selected
  if (tag && tag.match('palette[1-6]')) {
    const input = document.getElementById(tag)
    const img = document.querySelector(`img[data-palette="${tag}"]`)

    if (input) {
      input.checked = true
    }

    if (img) {
      palette(img).catch((err) => console.error(err))
    }
  }

  // ... initialise fill
  document.getElementById('fillcolour').value = state.W2P.fill.colour
  document.getElementById('fillalpha').value = state.W2P.fill.alpha

  // ... initialise grid
  document.getElementById('padding').value = state.W2P.padding
  document.getElementById('gridcolour').value = state.W2P.grid.colour
  document.getElementById('gridalpha').value = state.W2P.grid.alpha
  document.getElementById('gridsize').value = state.W2P.grid.size
  document.getElementById('gridwh').value = state.W2P.grid.wh
  document.getElementById('overlay').checked = state.W2P.grid.overlay

  switch (state.W2P.grid.type) {
    case 'none':
      document.getElementById('nogrid').click()
      break

    case 'square':
      document.getElementById('square').click()
      break

    case 'rectangular':
      document.getElementById('rectangular').click()
      break

    default:
      document.getElementById('square').click()
  }

  // ... initialise antialiasing
  switch (state.W2P.antialias.type) {
    case 'none':
      document.getElementById('noantialias').click()
      break

    case 'vertical':
      document.getElementById('vertical').click()
      break

    case 'horizontal':
      document.getElementById('horizontal').click()
      break

    case 'soft':
      document.getElementById('soft').click()
      break

    default:
      document.getElementById('vertical').click()
  }

  // ... initialise scale
  const a = 1.0
  const b = 4.0 / Math.log(4.0)
  const c = 0.25
  const v = Math.round(a + b * Math.log(state.W2P.scale.vertical / c))
  document.getElementById('vscale').value = v

  setScale(state.W2P.scale)

  // ... initialise slider
  local.start = new Slider('start', 'from', onSetStart)
  local.end = new Slider('end', 'to', onSetEnd)

  local.end.init(0, 100, 100)

  // ... show/hide 'here be cookies' message
  const footer = document.querySelector('footer')
  if (footer) {
    if (state.global.hideCookiesMessage) {
      footer.style.visibility = 'hidden'
    } else {
      footer.style.visibility = 'visible'
    }
  }
}

export function onDraw (bytes, width, height) {
  const array = new Uint8Array(bytes)
  const png = new Blob([array], { type: 'image/png' })

  draw(png, { width: width, height: height })
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

export function onDrop (event) {
  event.preventDefault()

  if (event.dataTransfer.items) {
    if (event.dataTransfer.items.length > 0 && event.dataTransfer.items[0].kind === 'file') {
      const file = event.dataTransfer.items[0].getAsFile()
      load(file.name, file)
    }
  } else if (event.dataTransfer.files) {
    if (event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0]
      load(file.name, file)
    }
  }
}

export function onDragOver (event) {
  event.preventDefault()
}

export function onPick (event) {
  const input = document.getElementById('file')

  input.value = null
  input.click()
}

export function onPicked (event) {
  const files = event.target.files

  if ((files.length > 0) && (files[0] !== undefined)) {
    load(files[0].name, files[0])
  }
}

export function onSize (event) {
  const v = document.querySelector('input[name="size"]:checked').value
  const custom = document.getElementById('custom')

  if (v === 'custom') {
    custom.style.visibility = 'visible'
    custom.focus()
  } else {
    custom.style.visibility = 'hidden'
  }

  const sz = size()

  const set = function () {
    return new Promise((resolve, reject) => {
      goSize((err, png) => {
        if (err) {
          reject(err)
        } else {
          resolve(png)
        }
      }, sz.width, sz.height)
    })
  }

  busy()
    .then(b => set())
    .catch((err) => console.error(err))
    .finally(unbusy)
}

export function onCustomSize (event) {
  if (event.type === 'keydown' && event.key === 'Enter') {
    const v = document.getElementById('custom').value
    const re = /([0-9]+)\s*x\s*([0-9]+)/
    const match = re.exec(v)

    if (match) {
      const w = parseInt(match[1], 10)
      const h = parseInt(match[2], 10)

      if (!isNaN(w) && !isNaN(h) && w >= 64 && w <= 8192 && h > 64 && h <= 8192) {
        const set = function () {
          return new Promise((resolve, reject) => {
            goCustomSize((err, png) => {
              if (err) {
                reject(err)
              } else {
                resolve(png)
              }
            }, w, h)
          })
        }

        busy()
          .then(b => set())
          .catch((err) => console.error(err))
          .finally(unbusy)
      }
    }
  }
}

export function onPalette (event) {
  const tag = event.target.id
  const img = document.querySelector(`img[data-palette="${tag}"]`)

  if (img) {
    state.setSelectedPalette(tag)

    if (loaded) {
      busy()
        .then(palette(img))
        .catch((err) => console.error(err))
        .finally(unbusy)
    } else {
      palette(img).catch((err) => console.error(err))
    }
  }
}

export function onPalettePick (event) {
  const tag = event.target.dataset.palette
  const input = document.getElementById(tag)
  const picker = document.getElementById('palette')

  if (input.disabled) {
    picker.dataset.palette = tag
    picker.value = null
    picker.click()
  }
}

export function onPalettePicked (event) {
  const files = event.target.files

  if ((files.length > 0) && (files[0] !== undefined)) {
    const tag = event.target.dataset.palette
    const input = document.getElementById(tag)
    const slot = document.querySelector(`img[data-palette="${tag}"]`)
    const url = slot.src
    const blob = files[0]

    if (blob && blob.type && blob.type === 'image/png') {
      slot.src = URL.createObjectURL(blob)
      input.disabled = false

      if (url) {
        URL.revokeObjectURL(url)
      }

      blob
        .arrayBuffer()
        .then(b => state.setPalette(tag, new Uint8Array(b)))
    }
  }
}

export function onPaletteDrop (event) {
  event.preventDefault()

  const tag = event.target.dataset.palette
  const input = document.getElementById(tag)
  const slot = event.target
  const url = slot.src

  const drop = function (blob) {
    if (blob && blob.type && blob.type === 'image/png') {
      slot.src = URL.createObjectURL(blob)
      input.disabled = false

      if (url) {
        URL.revokeObjectURL(url)
      }

      blob
        .arrayBuffer()
        .then(b => state.setPalette(tag, new Uint8Array(b)))
    }
  }

  if (event.dataTransfer.items) {
    if (event.dataTransfer.items.length > 0 && event.dataTransfer.items[0].kind === 'file') {
      drop(event.dataTransfer.items[0].getAsFile())
    }
  } else if (event.dataTransfer.files) {
    if (event.dataTransfer.files.length > 0) {
      drop(event.dataTransfer.files[0])
    }
  }
}

export function onPaletteDragOver (event) {
  event.preventDefault()
}

export function onPaletteDelete (event, tag) {
  event.preventDefault()

  const palette1 = document.getElementById('palette1')
  const input = document.getElementById(tag)
  const slot = document.querySelector(`img[data-palette="${tag}"]`)
  const url = slot.src

  if (input.checked) {
    palette1.checked = true
    state.setSelectedPalette('palette1')
  }

  input.disabled = true
  input.checked = false
  slot.src = './images/palette.png'

  if (url) {
    URL.revokeObjectURL(url)
  }

  state.setPalette(tag)
}

export function onFill (event) {
  if (event.type === 'change' || (event.type === 'keydown' && event.key === 'Enter')) {
    const set = function () {
      return new Promise((resolve, reject) => {
        goFill((err, png) => {
          if (err) {
            reject(err)
          } else {
            resolve(png)
          }
        }, fill())
      })
    }

    busy()
      .then(b => set())
      .catch((err) => console.error(err))
      .finally(unbusy)
  }
}

export function onPadding (event) {
  if (event.type === 'change' || (event.type === 'keydown' && event.key === 'Enter')) {
    const set = function () {
      return new Promise((resolve, reject) => {
        goPadding((err, png) => {
          if (err) {
            reject(err)
          } else {
            resolve(png)
          }
        }, padding())
      })
    }

    busy()
      .then(b => set())
      .catch((err) => console.error(err))
      .finally(unbusy)
  }
}

export function onGrid (event) {
  if (event.type === 'change' || (event.type === 'keydown' && event.key === 'Enter')) {
    const v = document.querySelector('input[name="grid"]:checked')

    if (v && v.value) {
      switch (v.value) {
        case 'none':
          document.getElementById('gridcolour').style.display = 'none'
          document.getElementById('gridalpha').style.display = 'none'
          document.getElementById('gridsize').style.display = 'none'
          document.getElementById('gridwh').style.display = 'none'
          document.getElementById('overlay').style.display = 'none'
          document.querySelector('#overlay + label').style.display = 'none'
          break

        case 'square':
          document.getElementById('gridcolour').style.display = 'block'
          document.getElementById('gridalpha').style.display = 'block'
          document.getElementById('gridsize').style.display = 'block'
          document.getElementById('gridwh').style.display = 'none'
          document.getElementById('overlay').style.display = 'block'
          document.querySelector('#overlay + label').style.display = 'block'
          break

        case 'rectangular':
          document.getElementById('gridcolour').style.display = 'block'
          document.getElementById('gridalpha').style.display = 'block'
          document.getElementById('gridsize').style.display = 'none'
          document.getElementById('gridwh').style.display = 'block'
          document.getElementById('overlay').style.display = 'block'
          document.querySelector('#overlay + label').style.display = 'block'
          break
      }
    }

    const set = function () {
      return new Promise((resolve, reject) => {
        goGrid((err, png) => {
          if (err) {
            reject(err)
          } else {
            resolve(png)
          }
        }, grid())
      })
    }

    busy()
      .then(b => set())
      .catch((err) => console.error(err))
      .finally(unbusy)
  }
}

export function onAntiAlias (event) {
  if (event.type === 'change' || (event.type === 'keydown' && event.key === 'Enter')) {
    const set = function () {
      return new Promise((resolve, reject) => {
        goAntialias((err, png) => {
          if (err) {
            reject(err)
          } else {
            resolve(png)
          }
        }, antialias())
      })
    }

    busy()
      .then(b => set())
      .catch((err) => console.error(err))
      .finally(unbusy)
  }
}

export function onVScale (event) {
  if (event.type === 'change' || (event.type === 'keydown' && event.key === 'Enter')) {
    setScale(scale())
  }
}

function setScale (v) {
  const set = function () {
    return new Promise((resolve, reject) => {
      goScale((err, png) => {
        if (err) {
          reject(err)
        } else {
          resolve(png)
        }
      }, v.horizontal, v.vertical)
    })
  }

  busy()
    .then(b => set())
    .catch((err) => console.error(err))
    .finally(unbusy)
}

function onSetStart (t, released) {
  document.getElementById('from').value = format(t)
  drawSlider()

  if (released) {
    const v = parseFloat(t.toString(), 10)

    if (!Number.isNaN(v)) {
      local.from = v
      if (loaded) {
        busy()
          .then(b => select())
          .then(b => redraw())
          .catch((err) => console.error(err))
          .finally(unbusy)
      } else {
        select()
      }
    }
  }
}

function onSetEnd (t, released) {
  document.getElementById('to').value = format(t)
  drawSlider()

  if (released) {
    const v = parseFloat(t.toString(), 10)

    if (!Number.isNaN(v)) {
      local.to = v
      if (loaded) {
        busy()
          .then(b => select())
          .then(b => redraw())
          .catch((err) => console.error(err))
          .finally(unbusy)
      } else {
        select()
      }
    }
  }
}

function drawSlider () {
  const canvas = document.getElementById('slider').querySelector('div.rail canvas')
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#7cb5ecc0'
  ctx.fillRect(0, 0, width, height)

  if (loaded) {
    const x = width * local.start.valueNow / local.duration
    const w = width * local.end.valueNow / local.duration

    ctx.fillStyle = '#dc322fc0'
    ctx.fillRect(x, 0, w - x, height)
  }
}

export function onExport (event) {
  const waveform = document.getElementById('png')
  const link = document.getElementById('download')
  const audiofile = waveform.dataset.filename
  let filename = 'waveform.png'

  if (audiofile && audiofile !== '') {
    const match = /(.*?)(?:\.[^.]*)$/.exec(audiofile)
    if (match && match.length > 1 && match[1].trim() !== '') {
      filename = match[1].trim() + '.png'
    }
  }

  if (waveform.src !== '') {
    link.href = waveform.src
    link.download = filename
    link.click()
  }
}

export function onClear (event) {
  const message = document.getElementById('message')
  const picker = document.getElementById('picker')
  const waveform = document.getElementById('png')
  const slider = document.getElementById('slider')
  const zoomed = document.getElementById('zoomed')
  const save = document.getElementById('export')
  const clear = document.getElementById('clear')

  if (waveform.src !== '') {
    URL.revokeObjectURL(waveform.src)
    waveform.dataset.name = ''
  }

  if (zoomed.src !== '') {
    URL.revokeObjectURL(zoomed.src)
  }

  picker.style.visibility = 'visible'
  slider.style.display = 'none'
  waveform.style.visibility = 'hidden'
  message.innerText = ''
  message.style.visibility = 'hidden'
  save.disabled = true
  clear.disabled = true

  loading = false
  loaded = false

  delete (local.from)
  delete (local.to)

  new Promise((resolve, reject) => {
    goClear((err) => {
      if (err) {
        reject(err)
      } else {
        resolve(true)
      }
    })
  }).catch(function (err) {
    console.error(err)
  })
}

function load (name, blob) {
  const message = document.getElementById('message')
  const picker = document.getElementById('picker')
  const waveform = document.getElementById('png')
  const slider = document.getElementById('slider')
  const save = document.getElementById('export')
  const clear = document.getElementById('clear')

  if (waveform.src !== '') {
    URL.revokeObjectURL(waveform.src)
  }

  loading = true
  loaded = false

  busy()
    .then(b => blob.arrayBuffer())
    .then(b => transcode(b))
    .then(b => store(b))
    .then(b => {
      waveform.dataset.filename = name
      picker.style.visibility = 'hidden'
      slider.style.display = 'block'
      save.disabled = false
      clear.disabled = false
      loading = false
      loaded = true

      drawSlider()
    })
    .catch((err) => {
      console.error(err)
      message.innerText = err
      message.style.visibility = 'visible'
    })
    .finally(unbusy)
}

function redraw () {
  const wh = size()
  const waveform = document.getElementById('png')

  if (waveform.src !== '') {
    URL.revokeObjectURL(waveform.src)
  }

  return render()
    .then(b => {
      const array = new Uint8Array(b)
      const png = new Blob([array], { type: 'image/png' })

      draw(png, wh)
    })
    .catch(function (err) {
      console.error(err)
    })
}

function draw (png, size) {
  const waveform = document.getElementById('png')
  const zoom = document.getElementById('zoom')
  const zoomed = document.getElementById('zoomed')
  const width = size.width
  const height = size.height
  const url = URL.createObjectURL(png)

  const ww = 645 // waveform.width
  const wh = 390 // waveform.height

  let w = ww
  let h = ww * height / width

  if (h > wh) {
    h = wh
    w = wh * width / height
  }

  waveform.style.width = `${w}px`
  waveform.style.height = `${h}px`
  waveform.style.visibility = 'visible'
  waveform.src = url

  const zw = 3 * w / 2
  const zh = 3 * h / 2

  zoom.style.width = `${zw}px`
  zoom.style.height = `${zh}px`
  zoom.style.marginLeft = `${-zw / 2}px`
  zoom.style.marginTop = `${-zh / 2}px`

  zoomed.src = url
  zoomed.style.width = `${zw}px`
  zoomed.style.height = `${zh}px`
}

async function transcode (bytes) {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  const ctx = new AudioContext()
  const buffer = await ctx.decodeAudioData(bytes)
  const offline = new OfflineAudioContext(1, 44100 * buffer.duration, 44100)
  const src = offline.createBufferSource()

  local.duration = buffer.duration
  local.start.init(0, buffer.duration, 0)
  local.end.init(0, buffer.duration, buffer.duration)

  src.buffer = buffer
  src.connect(offline.destination)
  src.start()

  return offline.startRendering()
}

async function store (buffer) {
  return new Promise((resolve, reject) => {
    goAudio((err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    }, buffer)
  })
}

async function render () {
  return new Promise((resolve, reject) => {
    goRender((err, png) => {
      if (err) {
        reject(err)
      } else {
        resolve(png)
      }
    })
  })
}

function palette (img) {
  const set = function (buffer) {
    return new Promise((resolve, reject) => {
      goPalette((err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      }, buffer)
    })
  }

  return fetch(img.src)
    .then(response => response.blob())
    .then(blob => blob.arrayBuffer())
    .then(buffer => set(buffer))
}

async function select () {
  return new Promise((resolve, reject) => {
    goSelect((err) => {
      if (err) {
        reject(err)
      } else {
        resolve(true)
      }
    }, local.from, local.to)
  }).catch(function (err) {
    console.error(err)
  })
}

function size () {
  let v = '645x390'

  const option = document.querySelector('input[name="size"]:checked')
  if (option) {
    v = option.value
  }

  if (v === 'custom') {
    v = document.getElementById('custom').value
  }

  const png = document.getElementById('png')
  const re = /([0-9]+)\s*x\s*([0-9]+)/
  const match = re.exec(v)

  if (match) {
    const w = parseInt(match[1], 10)
    const h = parseInt(match[2], 10)

    if (w > 0 && w <= 8192 && h > 0 && h <= 8192) {
      return { width: w, height: h }
    }
  }

  return { width: png.width, height: png.height }
}

function padding () {
  const v = document.getElementById('padding').value
  const padding = parseInt(v, 10)

  if (!isNaN(padding) && padding >= -16 && padding <= 32) {
    return padding
  }

  return 2
}

function fill () {
  const c = document.getElementById('fillcolour').value
  const a = document.getElementById('fillalpha').value

  let colour = c + 'ff'
  const alpha = parseInt(a, 10)
  if (!isNaN(alpha) && alpha < 16) {
    colour = c + '0' + alpha.toString(16)
  } else if (!isNaN(alpha) && alpha < 255) {
    colour = c + alpha.toString(16)
  }

  return { type: 'solid', colour: colour }
}

function grid () {
  const v = document.querySelector('input[name="grid"]:checked').value
  const c = document.getElementById('gridcolour').value
  const a = document.getElementById('gridalpha').value
  const s = document.getElementById('gridsize').value
  const wh = document.getElementById('gridwh').value
  const o = document.getElementById('overlay')
  const sz = size()

  // colour
  let colour = c + 'ff'
  const alpha = parseInt(a, 10)
  if (!isNaN(alpha) && alpha < 16) {
    colour = c + '0' + alpha.toString(16)
  } else if (!isNaN(alpha) && alpha < 255) {
    colour = c + alpha.toString(16)
  }

  // size
  let gridsize = '~64'

  if (Math.min(sz.width, sz.height) <= 320) {
    gridsize = '~32'
  } else if (Math.min(sz.width, sz.height) <= 1024) {
    gridsize = '~64'
  } else {
    gridsize = '~128'
  }

  let match = /([~=><≥≤])?\s*([0-9]+)/.exec(s)
  if (match) {
    const v = parseInt(match[2], 10)
    if (!Number.isNaN(v) && v >= 16 && v <= 1024) {
      gridsize = match[1] + v
    }
  }

  // width x height
  let gridwh = '~64x48'

  if (Math.min(sz.width, sz.height) <= 320) {
    gridwh = '~32x32'
  } else if (Math.min(sz.width, sz.height) <= 1024) {
    gridwh = '~64x48'
  } else {
    gridwh = '~128x80'
  }

  match = /([~=><≥≤])?\s*([0-9]+)\s*x\s*([0-9]+)/.exec(wh)
  if (match) {
    const w = parseInt(match[2], 10)
    const h = parseInt(match[3], 10)
    if (!Number.isNaN(w) && w >= 16 && w <= 1024 && !Number.isNaN(h) && h >= 16 && h <= 1024) {
      gridwh = match[1] + w + 'x' + h
    }
  } else {
    match = /([~=><≥≤])?\s*([0-9]+)/.exec(wh)
    if (match) {
      const v = parseInt(match[2], 10)
      if (!Number.isNaN(v) && v >= 16 && v <= 1024) {
        gridwh = match[1] + v + 'x' + v
      }
    }
  }

  // overlay
  let overlay = false
  if (o.checked) {
    overlay = true
  }

  // grid

  switch (v) {
    case 'none':
      return { type: 'none', colour: colour, size: gridsize, wh: gridwh, overlay: overlay }

    case 'square':
      return { type: 'square', colour: colour, size: gridsize, wh: gridwh, overlay: overlay }

    case 'rectangular':
      return { type: 'rectangular', colour: colour, size: gridwh, wh: gridwh, overlay: overlay }

    default:
      return { type: 'square', colour: colour, size: gridsize, wh: gridwh, overlay: overlay }
  }
}

function antialias () {
  const v = document.querySelector('input[name="antialias"]:checked').value

  switch (v) {
    case 'none':
      return { type: 'none' }

    case 'vertical':
      return { type: 'vertical' }

    case 'horizontal':
      return { type: 'horizontal' }

    case 'soft':
      return { type: 'soft' }

    default:
      return { type: 'vertical' }
  }
}

function scale () {
  const v = parseInt(document.getElementById('vscale').value, 10)

  const hscale = 1.0
  let vscale = 1.0

  if (v && !Number.isNaN(v)) {
    const a = 1.0
    const b = 4 / Math.log(4.0)
    const c = 25

    vscale = Math.round(c * Math.exp((v - a) / b)) / 100.0
  }

  return { horizontal: hscale, vertical: vscale }
}

function busy () {
  const overlay = document.getElementById('loading')
  const windmill = document.getElementById('windmill')

  return new Promise((resolve) => {
    if (loading || loaded) {
      overlay.style.visibility = 'visible'
      windmill.style.visibility = 'visible'
      windmill.style.display = 'block'
    }

    // FIXME: a delay seems to be the only way to get e.g. the 'size' radio buttons
    //        to be updated before the redraw is complete
    setTimeout(resolve, 100)
  })
}

function unbusy () {
  const overlay = document.getElementById('loading')
  const windmill = document.getElementById('windmill')

  overlay.style.visibility = 'hidden'
  windmill.style.display = 'none'
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
