/* global goRender */

const AudioContext = window.AudioContext || window.webkitAudioContext

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

function load (blob) {
  const picker = document.getElementById('picker')
  const waveform = document.getElementById('png')
  const width = waveform.width
  const height = waveform.height
  const padding = 4

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
      const w = waveform.width
      const h = waveform.width * height / width

      picker.style.visibility = 'hidden'
      waveform.style.width = `${w}px`
      waveform.style.height = `${h}px`
      waveform.style.visibility = 'visible'

      waveform.src = url
    })
    .catch(function (err) { console.error(err) })
}

async function transcode (bytes) {
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
