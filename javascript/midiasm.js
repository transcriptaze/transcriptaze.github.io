/* global goDisassemble */

export function onMIDI (files) {
  files.forEach(f => {
    load(f.name, f)
  })
}

let loading = false
let loaded = false

function load (name, blob) {
  const message = document.getElementById('message')
  const picker = document.getElementById('picker')
  const disassembly = document.getElementById('disassembly')
  // const save = document.getElementById('export')
  // const clear = document.getElementById('clear')

  // if (midi.src !== '') {
  //   URL.revokeObjectURL(midi.src)
  // }

  loading = true
  loaded = false

  busy()
    .then(b => blob.arrayBuffer())
    .then(b => disassemble(b))
    .then(b => {
      picker.style.display = 'none'
      disassembly.style.display = 'block'
      loading = false
      loaded = true
      disassembled(b)
    })
    .catch((err) => {
      console.error(err)
      message.innerText = err
      message.style.visibility = 'visible'
    })
    .finally(unbusy)
}

function disassemble (buffer) {
  return new Promise((resolve, reject) => {
    goDisassemble((obj, err) => {
      if (err) {
        reject(err)
      } else {
        resolve(obj)
      }
    }, buffer)
  })
}

function disassembled (object) {
  // midi.dataset.filename = name
  //     save.disabled = false
  //     clear.disabled = false

  const tbody = document.querySelector('div#disassembly table tbody')
  const tr = tbody.insertRow()

  if (object && object.MThd) {
    // TODO use template
    const track = tr.insertCell()
    const chunk = tr.insertCell()
    const bytes = tr.insertCell()
    const detail = tr.insertCell()

    track.classList.add('track')
    chunk.classList.add('chunk')
    bytes.classList.add('bytes')
    detail.classList.add('details')

    track.appendChild(document.createTextNode('---'))
    chunk.appendChild(document.createTextNode('MThd'))
    bytes.appendChild(document.createTextNode(object.MThd.bytes))
    detail.appendChild(document.createTextNode(object.MThd.detail))
  }
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

    // A 100ms delay seems to be the only way to get e.g. the 'size' radio buttons
    // to be updated and windmill displaying before the redraw is complete
    setTimeout(resolve, 100)
  })
}

function unbusy () {
  const overlay = document.getElementById('loading')
  const windmill = document.getElementById('windmill')

  overlay.style.visibility = 'hidden'
  windmill.style.display = 'none'
}
