import { initialiseComboBox } from './combobox.js'

const tags = {
  apikey: 'T2B.apikey',
  history: 'T2B.history',
  titles: 'T2B.titles'
}

export const State = function () {
  this.history = new Set()
  this.titles = new Map()
  this.apikey = 'AIzaSyCmyt_fgo-FJRnYST53tdwE9K9Nn-UO-ZA'

  this.restore = function () {
    this.history.clear()
    this.titles.clear()

    // Restore API key
    let blob = window.localStorage.getItem(tags.apikey)
    if (blob !== null) {
      this.apikey = blob.trim()
    }

    // Restore history
    try {
      blob = window.localStorage.getItem(tags.history)
      if (blob !== null) {
        JSON.parse(blob).forEach(vid => this.history.add(vid))
      }
    } catch (err) {
      // IGNORE
    }

    try {
      blob = window.localStorage.getItem(tags.titles)
      if (blob !== null) {
        JSON.parse(blob).forEach(([k, v]) => {
          this.titles.set(k, v)
        })
      }
    } catch (err) {
      // IGNORE
    }

    if (this.history.size === 0) {
      this.history.add('CKI7MnfBYJA')
      this.history.add('ZPIMomJP4kY')
      this.history.add('iFGhlOL4twQ')

      this.titles.set('CKI7MnfBYJA', 'Winter Song | Sara Bareilles & Ingrid Michaelson (Harp Cover)')
      this.titles.set('ZPIMomJP4kY', 'Happy Birthday - Bluesy Fingerstyle Guitar')
      this.titles.set('iFGhlOL4twQ', 'Chuck Loeb - Billy\'s song (cover)')
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
}
