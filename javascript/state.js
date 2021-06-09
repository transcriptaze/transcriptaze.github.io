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
    padding: 'W2P.padding',
    palettes: 'W2P.palettes',
    fill: 'W2P.fill',
    grid: 'W2P.grid',
    antialias: 'W2P.antialias',
    scale: 'W2P.scale'
  }
}

export const State = function () {
  this.global = {
    hideCookiesMessage: false
  }

  this.T2B = {
    history: new Set(),
    titles: new Map(),
    apikey: 'AIzaSyCmyt_fgo-FJRnYST53tdwE9K9Nn-UO-ZA'
  }

  this.W2P = {
    size: '645x390',
    padding: 2,
    customSize: '',
    palette: {
      selected: 'palette1',
      palettes: new Map()
    },

    fill: {
      type: 'solid',
      colour: '#000000',
      alpha: 255
    },

    grid: {
      type: 'square',
      colour: '#008000',
      alpha: 255,
      size: '~64',
      wh: '~64x48',
      overlay: false
    },

    antialias: {
      type: 'vertical'
    },

    scale: {
      horizontal: 1.0,
      vertical: 1.0
    }
  }

  this.restore = function (page) {
    // Restore global preferences
    const blob = window.localStorage.getItem(tags.global)
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

  this.setSelectedPalette = function (selected) {
    this.W2P.palette.selected = selected

    const object = {
      selected: this.W2P.palette.selected,
      palettes: Array.from(this.W2P.palette.palettes.entries())
    }

    window.localStorage.setItem(tags.W2P.palettes, JSON.stringify(object))
  }

  this.setPalette = function (slot, png) {
    if (png) {
      this.W2P.palette.palettes.set(slot, [...png])
    } else {
      this.W2P.palette.palettes.delete(slot)
    }

    const object = {
      selected: this.W2P.palette.selected,
      palettes: Array.from(this.W2P.palette.palettes.entries())
    }

    window.localStorage.setItem(tags.W2P.palettes, JSON.stringify(object))
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
  state.W2P.size = '645x390'
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

  // Restore W2P palettes
  try {
    blob = window.localStorage.getItem(tags.W2P.palettes)
    if (blob !== null) {
      const object = JSON.parse(blob)

      state.W2P.palette.selected = object.selected
      object.palettes.forEach(([k, v]) => {
        state.W2P.palette.palettes.set(k, v)
      })
    }
  } catch (err) {
    // IGNORE
  }

  // Restore W2P fill
  blob = window.localStorage.getItem(tags.W2P.fill)
  if (blob !== null) {
    state.W2P.fill = JSON.parse(blob)
  }

  // Restore W2P grid
  blob = window.localStorage.getItem(tags.W2P.grid)
  if (blob !== null) {
    state.W2P.grid = JSON.parse(blob)
  }
}
