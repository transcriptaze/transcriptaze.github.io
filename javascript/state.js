var State = function () {
  this.history = new Set()
  this.titles = new Map()
  this.apikey = ''

  this.restore = function() {
    this.history.clear()
    this.titles.clear()
    this.apikey = ''

    // Restore API key
    let blob = window.localStorage.getItem("apikey")
    if (blob !== null) {
      this.apikey = blob.trim()
    }
   
    // Restore history from local storage
    try {
      blob = window.localStorage.getItem("history")
      if (blob !== null) {
        JSON.parse(blob).forEach(vid => this.history.add(vid))
      } 
    } catch(err) {
      // IGNORE
    }
   
    try {
      blob = window.localStorage.getItem("titles")
      if (blob !== null) {
        JSON.parse(blob).forEach(([k,v]) => {
          this.titles.set(k,v)
        })
      } 
    } catch(err) {
      // IGNORE
    }
   
    if (this.history.size === 0) {
      this.history.add('CKI7MnfBYJA')
      this.history.add('ZPIMomJP4kY')
      this.history.add('iFGhlOL4twQ')        
     
      this.titles.set('CKI7MnfBYJA', 'Winter Song  |  Sara Bareilles & Ingrid Michaelson (Harp Cover)')
      this.titles.set('ZPIMomJP4kY', 'Happy Birthday - Bluesy Fingerstyle Guitar')
      this.titles.set('iFGhlOL4twQ', 'Chuck Loeb - Billy\'s song (cover)')        
    }
   
    setPickList()
  }

  this.addVideo = function(vid) {
    if (vid.trim() !== '') {
      const list = new Set([ vid.trim() ])

      this.history.forEach(v => list.add(v))
      this.history = new Set(Array.from(list).slice(0,6))

      window.localStorage.setItem('history', JSON.stringify(Array.from(this.history)))

      lookup(state.apikey, vid.trim())
    }
  }

  this.setApiKey = function(key) {
    this.apikey = key.trim()

    window.localStorage.setItem('apikey', this.apikey)
  }
}

async function lookup(apikey, vid) {
  if (apikey !== '' || vid !== '') {
    const url = 'https://www.googleapis.com/youtube/v3/videos?part=snippet&id=' + vid.trim() + '&fields=items(id,snippet)&key=' + apikey
    const request = new Request(url, { 
      method: 'GET', 
      mode: 'cors',
      cache: 'no-cache', 
      credentials: 'same-origin',
      redirect: 'follow', 
      referrerPolicy: 'no-referrer'
    })

    const promise = fetch(request)
                        .then(response => response.json())
                        .then(object => {
                            if (object.items.length > 0) {
                              return object.items[0].snippet.title
                            }

                            return ''
                        })
                        .catch(err => console.log(err))

    const title = await promise

    if (title.trim() !== '') {
      state.titles.set(vid.trim(), title.trim())
      window.localStorage.setItem('titles', JSON.stringify(Array.from(state.titles.entries()).slice(0,20)))
      setPickList()
    }
  }
}

function onApiKey(event) {
  if (event.key === 'Enter') {
    state.setApiKey(document.getElementById('apikey').value)
  }
}

function setPickList() {
  const items = []

  state.history.forEach(vid => {
    let li = document.createElement('li')
    let title = 'https://www.youtube.com/watch?v='+ vid

    if (state.titles.has(vid)) {
        title = state.titles.get(vid)
    }

    li.id = vid
    li.setAttribute('role', 'option')
    li.dataset.url = 'https://www.youtube.com/watch?v='+ vid
    li.appendChild(document.createTextNode(title))
        
    items.push(li)
  })

  const list = document.getElementById('cb1-listbox')
  const clone = list.cloneNode()

  clone.replaceChildren(...items)
  list.replaceWith(clone)
  recreateComboBox('picklist')
}
