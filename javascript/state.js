var State = function () {
  this.history = new Set()

  this.restore = function() {
      const list = []
      const stored = window.localStorage.getItem("history")

      if (stored !== null) {
        stored.split(',').forEach(v => {
          if (v.trim() !== '') {
              list.push(v.trim())            
          }
        })
      }

      if (list.length === 0) {
        list.push('CKI7MnfBYJA')
        list.push('ZPIMomJP4kY')
        list.push('iFGhlOL4twQ')
      }

      this.history = new Set(list)      

      this.history.forEach(v => {
        let li = document.createElement('li')
        li.id = v
        li.setAttribute('role', 'option')
        li.appendChild(document.createTextNode('https://www.youtube.com/watch?v='+ v));
        document.getElementById('cb1-listbox').appendChild(li)
      })
  }

  this.addVideo = function(vid) {
    if (vid.trim() !== '') {
      const list = new Set([ vid.trim() ])

      this.history.forEach(v => list.add(v))      
      this.history = new Set(Array.from(list).slice(0,6))

      window.localStorage.setItem("history", Array.from(this.history).toString())      
    }
  }
}