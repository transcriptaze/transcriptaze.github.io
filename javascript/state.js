const tags = {
  global: 'global',

  T2B: {
    apikey: 'T2B.apikey',
    history: 'T2B.history',
    titles: 'T2B.titles'
  },

  W2P: {
    size: 'W2P.size',
    customSize: 'W2P.customSize',
    grid: 'W2P.grid'
  }
}

export const State = function () {
  this.global = {
    hideCookiesMessage: false
  },

  this.T2B = {
    history: new Set(),
    titles: new Map(),
    apikey: 'AIzaSyCmyt_fgo-FJRnYST53tdwE9K9Nn-UO-ZA'
  }

  this.W2P = {
    size: '645x392',
    customSize: '',
    grid: {
      type: 'square',
      padding: 2,
      colour: '#008000',
      alpha: 255,
      size: '~64',
      wh: '~64x48',
      overlay: false
    }
  }

  this.restore = function (page) {
    // Restore global preferences
    let blob = window.localStorage.getItem(tags.global)
    if (blob !== null) {
      this.global = JSON.parse(blob)
    }

    // Restore page preferences
    switch (page) {
      case 'T2B':
        restoreT2B(this)
        break

      case 'W2P':
        restoreW2P(this)
        break
    }
  }

  this.acceptCookies = function () {
      this.global.hideCookiesMessage = true

      window.localStorage.setItem(tags.global, JSON.stringify(this.global))
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

  this.setGrid = function (type, padding, colour, alpha, size, wh, overlay) {
    this.W2P.grid.type = type
    this.W2P.grid.padding = padding
    this.W2P.grid.colour = colour
    this.W2P.grid.alpha = alpha
    this.W2P.grid.size = size
    this.W2P.grid.wh = wh
    this.W2P.grid.overlay = overlay

    window.localStorage.setItem(tags.W2P.grid, JSON.stringify(this.W2P.grid))
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

  // Restore W2P grid
  blob = window.localStorage.getItem(tags.W2P.grid)
  if (blob !== null) {
    state.W2P.grid = JSON.parse(blob)
  }
}
