## IN PROGRESS

### W2P

- [ ] Move event handling+redraw to Go
      - settings
      - size
      - fill
      - padding
      - antialias
      - selection
      - move grid validation to Go
      
- [ ] Update transcriptaze Github page
- [ ] Optimize draw/redraw
- [ ] https://schollz.com/blog/waveforms/
- [ ] (optionally) show audio info

- [x] Let busy() return a Promise and then chain everything off that (?)
- [x] Rectangular grid: handle partial entry e.g. ~64
- [x] Segment of audio
- [x] Save/restore selected palette
- [x] v-scale
- [x] Palette
- [x] Browser tab icon
- [x] Move padding out of grid
- [x] Fill settings
- [x] Anti-alias settings
- [x] Grid settings
- [x] Dismissable cookie message
- [x] Zoom
- [x] Export button
- [x] Clear button
- [x] Fix grid
- [x] Loading windmill
- [x] Size settings
- [x] Padding
- [x] Pass width and height as parameters
- [x] Make PNG downloadable
- [x] Separate antialias and render passes

### T2B

- [ ] Store slider settings with video ID (for playing along!)
- [ ] Finer slider increments (for playing along)
- [ ] 'clear' entirely messes up the slider

## TODO

- [ ] Export as MIDI
- [ ] Load audio from file
- [ ] View as JSON
- [ ] Dangling left slider label
- [ ] Double sliders (one for visible range, one for audio range) (?)
- [ ] Go all neumorphic (?)
      - https://codepen.io/ma_suwa/pen/eYdZVML
      - https://github.com/jvnaveenbabu/Neumorphism-Designs
- [ ] Consider using an iterator that uses JS.Index()
      https://stackoverflow.com/questions/14000534/what-is-most-idiomatic-way-to-create-an-iterator-in-go

## NOTES

1. https://w3c.github.io/aria-practices/examples/slider/multithumb-slider.html
2. https://gist.github.com/rodrigoborgesdeoliveira/987683cfbfcc8d800192da1e73adc486

