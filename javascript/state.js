var State = function () {
  this.history = new Set()

  this.restore = function() {
      const list = []
      const history = window.localStorage.getItem("history")

      if (history !== null) {
        JSON.parse(history).forEach(v => list.push(v.vid))
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
      const set = new Set([ vid.trim() ])
      const json = []

      this.history.forEach(v => set.add(v))      
      this.history = new Set(Array.from(set).slice(0,6))

      this.history.forEach(v => {
        json.push({
          vid: v
        })
      })

      window.localStorage.setItem("history", JSON.stringify(json))      
    }
  }
}