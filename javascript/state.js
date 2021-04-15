const tags = {
  apikey: 'T2B.apikey',
  history: 'T2B.history',
  titles: 'T2B.titles',

  W2P: {
    customSize: 'W2P.customSize'
  }
}

export const State = function () {
  this.history = new Set()
  this.titles = new Map()
  this.apikey = 'AIzaSyCmyt_fgo-FJRnYST53tdwE9K9Nn-UO-ZA'

  this.W2P = {
    customSize: ''
  }

  this.restore = function (page) {
    switch (page) {
      case 'T2B':
        restoreT2B(this)
        break

      case 'W2P':
        restoreW2P(this)
        break
    }
  }

  this.addVideo = function (vid) {
    if (vid.trim() !== '') {
      const lru = new Set([vid.trim(), ...Array.from(this.history)])

      this.history = new Set(Array.from(lru).slice(0, 8))

      window.localStorage.setItem(tags.history, JSON.stringify(Array.from(this.history)))
    }
  }

  this.setVideoTitle = function (vid, title) {
    const key = vid.trim()

    if (key !== '') {
      if (this.titles.has(key)) {
        this.titles.set(key, title.trim())

        const blob = JSON.stringify(Array.from(this.titles.entries()))

        window.localStorage.setItem(tags.titles, blob)
      }
    }
  }

  this.setApiKey = function (key) {
    this.apikey = key.trim()

    window.localStorage.setItem(tags.apikey, this.apikey)
  }

  this.setCustomSize = function (size) {
    this.W2P.customSize = size.trim()

    window.localStorage.setItem(tags.W2P.customSize, this.W2P.customSize)
  }
}

function restoreT2B (state) {
  state.history.clear()
  state.titles.clear()

  // Restore T2B API key
  let blob = window.localStorage.getItem(tags.apikey)
  if (blob !== null) {
    state.apikey = blob.trim()
  }

  // Restore T2B history
  try {
    blob = window.localStorage.getItem(tags.history)
    if (blob !== null) {
      JSON.parse(blob).forEach(vid => state.history.add(vid))
    }
  } catch (err) {
    // IGNORE
  }

  try {
    blob = window.localStorage.getItem(tags.titles)
    if (blob !== null) {
      JSON.parse(blob).forEach(([k, v]) => {
        state.titles.set(k, v)
      })
    }
  } catch (err) {
    // IGNORE
  }

  if (state.history.size === 0) {
    state.history.add('CKI7MnfBYJA')
    state.history.add('ZPIMomJP4kY')
    state.history.add('iFGhlOL4twQ')

    state.titles.set('CKI7MnfBYJA', 'Winter Song | Sara Bareilles & Ingrid Michaelson (Harp Cover)')
    state.titles.set('ZPIMomJP4kY', 'Happy Birthday - Bluesy Fingerstyle Guitar')
    state.titles.set('iFGhlOL4twQ', 'Chuck Loeb - Billy\'s song (cover)')
  }
}

function restoreW2P (state) {
  state.W2P.customSize = ''

  // Restore W2P custom size
  const blob = window.localStorage.getItem(tags.W2P.customSize)
  if (blob !== null) {
    state.W2P.customSize = blob.trim()
  }
}
