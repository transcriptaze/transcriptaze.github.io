/* global goRender */

import { State } from './state.js'

const state = new State()

export function initialise () {
  state.restore('W2P')

  document.getElementById('custom').value = state.W2P.customSize
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
    load(files[0])
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
}

function load (blob) {
  const controls = document.getElementById('controls')
  const picker = document.getElementById('picker')
  const waveform = document.getElementById('png')
  const zoom = document.getElementById('zoom')
  const zoomed = document.getElementById('zoomed')
  const padding = 3
  const wh = size()
  const width = wh.width
  const height = wh.height

  if (waveform.src !== '') {
    URL.revokeObjectURL(waveform.src)
  }

  return blob.arrayBuffer()
    .then(b => transcode(b))
    .then(b => render(b, width, height, padding))
    .then(b => {
      const array = new Uint8Array(b)
      const png = new Blob([array], { type: 'image/png' })
      const url = URL.createObjectURL(png)

      let w = waveform.width
      let h = waveform.width * height / width

      if (h > waveform.height) {
        h = waveform.height
        w = waveform.height * width / height
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

      picker.style.visibility = 'hidden'
      controls.style.display = 'block'
    })
    .catch(function (err) { console.error(err) })
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

async function render (buffer, width, height, padding) {
  return new Promise((resolve, reject) => {
    goRender((err, png) => {
      if (err) {
        reject(err)
      } else {
        resolve(png)
      }
    }, buffer, width, height, padding)
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

      return { width: w, height: h }
    }
  }

  return { width: png.width, height: png.height }
}
