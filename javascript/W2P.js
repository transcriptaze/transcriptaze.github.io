/* global goStore, goRender, goClear */

import { State } from './state.js'

const state = new State()

let loaded = false

export function initialise () {
  loaded = false

  state.restore('W2P')

  document.getElementById('custom').value = state.W2P.customSize
  document.querySelector(`input[name="size"][value="${state.W2P.size}"]`).checked = true
}

export function onDrop (event) {
  event.preventDefault()

  if (event.dataTransfer.items) {
    if (event.dataTransfer.items.length > 0 && event.dataTransfer.items[0].kind === 'file') {
      load(event.dataTransfer.items[0].getAsFile())
    }
  } else if (event.dataTransfer.files) {
    if (event.dataTransfer.files.length > 0) {
      load(event.dataTransfer.files[0])
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

    if (loaded) {
      busy()
      new Promise((resolve) => setTimeout(resolve, 100))
        .then(b => redraw())
        .finally(unbusy)
    }
  }
}

export function onCustomSize (event) {
  if (loaded && event.type === 'keydown' && event.key === 'Enter') {
    const v = document.getElementById('custom').value
    const re = /([0-9]+)\s*x\s*([0-9]+)/
    const match = re.exec(v)

    if (match) {
      const w = parseInt(match[1], 10)
      const h = parseInt(match[2], 10)

      if (w >= 64 && w <= 8192 && h > 64 && h <= 8192) {
        busy()
        new Promise((resolve) => setTimeout(resolve, 100))
          .then(b => redraw())
          .finally(unbusy)
      }
    }
  }
}

export function onGrid (event) {
  const v = document.querySelector('input[name="grid"]:checked').value

  if (loaded) {
    busy()
    new Promise((resolve) => setTimeout(resolve, 100))
      .then(b => redraw())
      .finally(unbusy)
  }
}

export function onPadding (event) {
  if (loaded && event.type === 'keydown' && event.key === 'Enter') {
    const v = document.getElementById('padding').value
    const padding = parseInt(v, 10)

    if (padding >= -16 && padding <= 32) {
      busy()
      new Promise((resolve) => setTimeout(resolve, 100))
        .then(b => redraw())
        .finally(unbusy)
    }
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
  waveform.style.visibility = 'hidden'
  message.innerText = ''
  message.style.visibility = 'hidden'
  save.disabled = true
  clear.disabled = true

  loaded = false

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
  const save = document.getElementById('export')
  const clear = document.getElementById('clear')
  const wh = size()
  const width = wh.width
  const height = wh.height

  if (waveform.src !== '') {
    URL.revokeObjectURL(waveform.src)
  }

  busy()
  return sleep(100)
    .then(b => blob.arrayBuffer())
    .then(b => transcode(b))
    .then(b => store(b))
    .then(b => render(width, height, grid()))
    .then(b => {
      const array = new Uint8Array(b)
      const png = new Blob([array], { type: 'image/png' })

      draw(png, wh)

      waveform.dataset.filename = name
      picker.style.visibility = 'hidden'
      save.disabled = false
      clear.disabled = false
      loaded = true
    })
    .catch(function (err) {
      console.error(err)
      message.innerText = err
      message.style.visibility = 'visible'
    })
    .finally(unbusy)
}

function redraw () {
  const wh = size()
  const waveform = document.getElementById('png')
  const width = wh.width
  const height = wh.height

  if (waveform.src !== '') {
    URL.revokeObjectURL(waveform.src)
  }

  return render(width, height, grid())
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

  src.buffer = buffer
  src.connect(offline.destination)
  src.start()

  return offline.startRendering()
}

async function store (buffer) {
  return new Promise((resolve, reject) => {
    goStore((err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    }, buffer)
  })
}

async function render (width, height, grid) {
  return new Promise((resolve, reject) => {
    goRender((err, png) => {
      if (err) {
        reject(err)
      } else {
        resolve(png)
      }
    }, width, height, grid)
  })
}

function size () {
  const option = document.querySelector('input[name="size"]:checked')
  let v = option.value
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
      if (option.value === 'custom') {
        state.setCustomSize(v)
      }

      state.setSize(option.value)

      return { width: w, height: h }
    }
  }

  return { width: png.width, height: png.height }
}

function grid () {
  const v = document.querySelector('input[name="grid"]:checked').value
  const p = document.getElementById('padding').value
  
  let padding = parseInt(p, 10)
  // if (isNaN(padding)) {
  //   padding = 0
  // }

  switch (v) {
    case 'none':
      return { type: 'none', padding: padding }

    default:
      return { type: 'square', size: 64, padding: padding }
  }
}

function busy () {
  const loading = document.getElementById('loading')
  const windmill = document.getElementById('windmill')

  loading.style.visibility = 'visible'
  windmill.style.visibility = 'visible'
  windmill.style.display = 'block'
}

function unbusy () {
  const loading = document.getElementById('loading')
  const windmill = document.getElementById('windmill')

  loading.style.visibility = 'hidden'
  windmill.style.display = 'none'
}

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}
