'use strict';

var Slider = function (node, label, handler) {
  this.domNode = document.getElementById(node)
  this.labelNode = document.getElementById(label)
  this.labelLeft = this.domNode.classList.contains('min')
  this.labelRight = this.domNode.classList.contains('max')
  this.railDomNode = document.getElementById(node).parentNode
  this.handler = handler

  this.minDomNode = false
  this.maxDomNode = false

  this.valueNow = 50

  this.railMin = 0
  this.railMax = 100
  this.railWidth = 0

  this.thumbWidth = 10

  this.keyCode = Object.freeze({
    left: 37,
    up: 38,
    right: 39,
    down: 40,
    pageUp: 33,
    pageDown: 34,
    end: 35,
    home: 36,
  })
}

// Initialize slider
Slider.prototype.init = function (min, max, t) {
  this.valueNow = t
  this.domNode.setAttribute('aria-valuenow', t)
  this.domNode.setAttribute('aria-valuemin', min)
  this.domNode.setAttribute('aria-valuemax', max)

  this.railMin = min
  this.railMax = max
  this.railWidth = parseInt(this.railDomNode.style.width.slice(0, -2));

  if (this.domNode.previousElementSibling) {
    this.minDomNode = this.domNode.previousElementSibling;
  }

  if (this.domNode.nextElementSibling) {
    this.maxDomNode = this.domNode.nextElementSibling;
  }

  if (this.domNode.tabIndex != 0) {
    this.domNode.tabIndex = 0;
  }

  this.domNode.addEventListener('keydown', this.handleKeyDown.bind(this));
  this.domNode.addEventListener('mousedown', this.handleMouseDown.bind(this));
  this.domNode.addEventListener('focus', this.handleFocus.bind(this));
  this.domNode.addEventListener('blur', this.handleBlur.bind(this));

  this.moveSliderTo(this.valueNow);
};

Slider.prototype.moveSliderTo = function (value, released) {
  var valueMax = parseInt(this.domNode.getAttribute('aria-valuemax'));
  var valueMin = parseInt(this.domNode.getAttribute('aria-valuemin'));

  if (value > valueMax) {
    value = valueMax;
  }

  if (value < valueMin) {
    value = valueMin
  }

  this.valueNow = value
  this.dolValueNow = value

  if (released) {
    this.domNode.setAttribute('aria-valuenow', this.valueNow);    
  }

  if (this.minDomNode) {
    this.minDomNode.setAttribute('aria-valuemax', this.valueNow);
  }

  if (this.maxDomNode) {
    this.maxDomNode.setAttribute('aria-valuemin', this.valueNow);
  }

  const range = this.railMax - this.railMin
  const scale = this.railWidth/range
  const pos = (this.valueNow - this.railMin) * scale

  if (this.labelLeft) {
    this.labelNode.style.left = Math.ceil(pos - 50) + 'px'
  }

  if (this.labelRight) {
    this.labelNode.style.left = Math.ceil(pos + 10) + 'px'
  }

  if (this.minDomNode) {
    this.domNode.style.left = Math.ceil(pos) + 'px'
  } else {
    this.domNode.style.left = Math.ceil(pos) - this.thumbWidth + 'px'
  }

  if (this.handler) {
    this.handler(this.dolValueNow, released)
  }
}

Slider.prototype.handleKeyDown = function (event) {
  var flag = false;

  switch (event.keyCode) {
    case this.keyCode.left:
    case this.keyCode.down:
      this.moveSliderTo(this.valueNow - 1, true)
      flag = true;
      break;

    case this.keyCode.right:
    case this.keyCode.up:
      this.moveSliderTo(this.valueNow + 1, true)
      flag = true;
      break;

    case this.keyCode.pageDown:
      this.moveSliderTo(this.valueNow - 10, true)
      flag = true;
      break;

    case this.keyCode.pageUp:
      this.moveSliderTo(this.valueNow + 10, true)
      flag = true;
      break;

    case this.keyCode.home:
      this.moveSliderTo(this.railMin, true)
      flag = true;
      break;

    case this.keyCode.end:
      this.moveSliderTo(this.railMax, true)
      flag = true;
      break;

    default:
      break;
  }

  if (flag) {
    event.preventDefault();
    event.stopPropagation();
  }
};

Slider.prototype.handleFocus = function () {
  this.domNode.classList.add('focus');
  this.railDomNode.classList.add('focus');
};

Slider.prototype.handleBlur = function () {
  this.domNode.classList.remove('focus');
  this.railDomNode.classList.remove('focus');
};

Slider.prototype.handleMouseDown = function (event) {
  var self = this;

  var handleMouseMove = function (event) {
    var diffX = event.pageX - self.railDomNode.offsetLeft
    self.valueNow = self.railMin + parseInt(((self.railMax - self.railMin) * diffX) / self.railWidth)

    self.moveSliderTo(self.valueNow)

    event.preventDefault()
    event.stopPropagation()
  }

  var handleMouseUp = function () {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)

    self.moveSliderTo(self.valueNow, true)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)

  event.preventDefault()
  event.stopPropagation()

  this.domNode.focus()
}

function format(t) {
  let minutes = 0
  let seconds = 0

  if (t > 0) {
    minutes = Math.floor(t/60)
    seconds = t % 60
  }

  return String(minutes) + ':' + String(seconds).padStart(2,'0')
}
