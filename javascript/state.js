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
        let option = document.createElement('option')
        option.text = 'https://www.youtube.com/watch?v='+ v
        option.value = 'https://www.youtube.com/watch?v='+ v
        document.getElementById('favourites').appendChild(option)
      })
  }

  this.addVideo = function(vid) {
    if (vid !== '') {
      const list = new Set([ vid ])

      this.history.forEach(v => list.add(v))
      this.history = list

      window.localStorage.setItem("history", Array.from(list).toString())      
    }
  }
}