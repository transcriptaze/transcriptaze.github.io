const tags = {
  T2B: {
    apikey: 'T2B.apikey',
    history: 'T2B.history',
    titles: 'T2B.titles'
  },

  W2P: {
    size: 'W2P.size',
    customSize: 'W2P.customSize'
  }
}

export const State = function () {
  this.T2B = {
    history: new Set(),
    titles: new Map(),
    apikey: 'AIzaSyCmyt_fgo-FJRnYST53tdwE9K9Nn-UO-ZA'
  }

  this.W2P = {
    size: '645x392',
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
      const lru = new Set([vid.trim(), ...Array.from(this.T2B.history)])

      this.T2B.history = new Set(Array.from(lru).slice(0, 8))

      window.localStorage.setItem(tags.T2B.history, JSON.stringify(Array.from(this.T2B.history)))
    }
  }

  this.setVideoTitle = function (vid, title) {
    const key = vid.trim()

    if (key !== '') {
      if (this.T2B.titles.has(key)) {
        this.T2B.titles.set(key, title.trim())

        const blob = JSON.stringify(Array.from(this.T2B.titles.entries()))

        window.localStorage.setItem(tags.T2B.titles, blob)
      }
    }
  }

  this.setApiKey = function (key) {
    this.T2B.apikey = key.trim()

    window.localStorage.setItem(tags.T2B.apikey, this.T2B.apikey)
  }

  this.setSize = function (size) {
    this.W2P.size = size.trim()

    window.localStorage.setItem(tags.W2P.size, this.W2P.size)
  }

  this.setCustomSize = function (size) {
    this.W2P.customSize = size.trim()

    window.localStorage.setItem(tags.W2P.customSize, this.W2P.customSize)
  }
}

function restoreT2B (state) {
  state.T2B.history.clear()
  state.T2B.titles.clear()

  // Restore T2B API key
  let blob = window.localStorage.getItem(tags.T2B.apikey)
  if (blob !== null) {
    state.T2B.apikey = blob.trim()
  }

  // Restore T2B history
  try {
    blob = window.localStorage.getItem(tags.T2B.history)
    if (blob !== null) {
      JSON.parse(blob).forEach(vid => state.T2B.history.add(vid))
    }
  } catch (err) {
    // IGNORE
  }

  try {
    blob = window.localStorage.getItem(tags.T2B.titles)
    if (blob !== null) {
      JSON.parse(blob).forEach(([k, v]) => {
        state.T2B.titles.set(k, v)
      })
    }
  } catch (err) {
    // IGNORE
  }

  if (state.T2B.history.size === 0) {
    state.T2B.history.add('CKI7MnfBYJA')
    state.T2B.history.add('ZPIMomJP4kY')
    state.T2B.history.add('iFGhlOL4twQ')

    state.T2B.titles.set('CKI7MnfBYJA', 'Winter Song | Sara Bareilles & Ingrid Michaelson (Harp Cover)')
    state.T2B.titles.set('ZPIMomJP4kY', 'Happy Birthday - Bluesy Fingerstyle Guitar')
    state.T2B.titles.set('iFGhlOL4twQ', 'Chuck Loeb - Billy\'s song (cover)')
  }
}

function restoreW2P (state) {
  state.W2P.size = '641x386'
  state.W2P.customSize = ''

  // Restore W2P size
  let blob = window.localStorage.getItem(tags.W2P.size)
  if (blob !== null) {
    state.W2P.size = blob.trim()
  }

  // Restore W2P custom size
  blob = window.localStorage.getItem(tags.W2P.customSize)
  if (blob !== null) {
    state.W2P.customSize = blob.trim()
  }
}
