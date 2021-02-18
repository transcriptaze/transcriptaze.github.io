var State = function () {
  this.history = new Set()

  this.restore = function() {
      const list = window.localStorage.getItem("history")

      if (list === null) {
        list.split(',').forEach(v => this.history.add('CKI7MnfBYJA'))
        list.split(',').forEach(v => this.history.add('ZPIMomJP4kY'))
      } else {
        list.split(',').forEach(v => this.history.add(v))
      }

      this.history.forEach(v => {
        let li = document.createElement('li')
        li.id = v
        li.setAttribute('role', 'option')
        li.appendChild(document.createTextNode('https://www.youtube.com/watch?v='+ v));
        document.getElementById('cb1-listbox').appendChild(li)
      })
  }

  this.addVideo = function(vid) {
    if (vid !== '') {
      const list = new Set([ vid ])

      this.history.forEach(v => list.add(v))
      this.history = new Set(Array.from(list).slice(0,6))

      window.localStorage.setItem("history", Array.from(history).toString())      
    }
  }
}