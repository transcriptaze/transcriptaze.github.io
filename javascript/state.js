var State = function () {
  this.history = new Map()
  this.apikey = ''

  this.restore = function() {
      this.history = new Map()      
      this.apikey = ''

      // Restore API key
      let blob = window.localStorage.getItem("apikey")
      if (blob !== null) {
        this.apikey = blob.trim()
      }

      // Restore history from local storage
      blob = window.localStorage.getItem("history")
      if (blob !== null) {
        try {
          JSON.parse(blob).forEach(([k,v]) => {
            this.history.set(k,v)
          })
        } catch(err) {
          // IGNORE
        }
      }

      // Initialise with some examples
      if (this.history.size === 0) {
        this.history.set('CKI7MnfBYJA', { vid:'ZPIMomJP4kY', title:'Winter Song  |  Sara Bareilles & Ingrid Michaelson (Harp Cover)' })
        this.history.set('ZPIMomJP4kY', { vid:'CKI7MnfBYJA', title:'Happy Birthday - Bluesy Fingerstyle Guitar' })
        this.history.set('iFGhlOL4twQ', { vid:'iFGhlOL4twQ', title:'Chuck Loeb - Billy\'s song (cover)' })        
      }

      // Initialise pick list
      for (const [k,v] of this.history) {        
        let li = document.createElement('li')
        let title = 'https://www.youtube.com/watch?v='+ v.vid

        if (v.title !== undefined && v.title !== null && v.title.trim() != '') {
          title = v.title.trim()
        }
        
        li.id = k
        li.setAttribute('role', 'option')
        li.dataset.url = 'https://www.youtube.com/watch?v='+ v.vid
        li.appendChild(document.createTextNode(title))
        
        document.getElementById('cb1-listbox').appendChild(li)
      }
  }

  this.addVideo = function(vid) {
    const store = function(history) {
      const h = new Map()
      const list = new Set([ vid.trim() ])

      history.forEach(v => list.add(v.vid))

      Array.from(list).slice(0,6).forEach(id => {
        if (history.has(id)) {
          h.set(id, history.get(id))          
        } else {
          h.set(id, { vid: id, title:'' })                    
        }
      })      

      window.localStorage.setItem('history', JSON.stringify(Array.from(h.entries())))

      return h
    }

    if (vid.trim() !== '') {
      const promise = getVideoTitle(vid)
      
      if (promise !== null) {
        promise.then(title => {
          this.history.set(vid, { vid: vid, title: title })
          this.history = store(this.history)        
        })
      } else {
        this.history = store(this.history)        
      }
    }
  }

  this.setApiKey = function(key) {
    this.apikey = key.trim()
    
    window.localStorage.setItem('apikey', this.apikey)
  }
}

async function getVideoTitle(vid) {
  const apikey = state.apikey

  if (apikey !== '' && vid.trim() !== '') {
    const url = 'https://www.googleapis.com/youtube/v3/videos?part=snippet&id=' + vid.trim() + '&fields=items(id,snippet)&key=' + apikey
    const request = new Request(url, { 
      method: 'GET', 
      mode: 'cors',
      cache: 'no-cache', 
      credentials: 'same-origin',
      redirect: 'follow', 
      referrerPolicy: 'no-referrer'
    })

    return await fetch(request)
      .then(response => response.json())
      .then(object => {
        if (object.items.length > 0) {
          return object.items[0].snippet.title
        }
      })
      .catch(err => console.log(err))
  }

  return null
}

function onApiKey(event) {
  if (event.key === 'Enter') {
    state.setApiKey(document.getElementById('apikey').value)
  }
}
