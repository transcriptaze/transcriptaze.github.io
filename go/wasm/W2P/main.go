// +build js,wasm

// WASM interface for the wav2png functions
package main

import (
	"bytes"
	"encoding/binary"
	"image/color"
	"strings"
	"syscall/js"
	"time"

	"github.com/transcriptaze/wav2png/wav2png"
)

const VERSION = "v0.1.0"

var BLACK = color.NRGBA{R: 0x00, G: 0x00, B: 0x00, A: 255}
var DARKGREEN = color.NRGBA{R: 0x00, G: 0x80, B: 0x00, A: 255}

type audio struct {
	sampleRate float64
	channels   int
	duration   time.Duration
	length     int
	samples    []float32
}

var wav *audio

var options = struct {
	size       Size
	customSize Size
	padding    Padding

	fill     Fill
	palettes struct {
		selected string
	}
	gridspec  wav2png.GridSpec
	antialias Antialias
	scale     Scale
}{
	size: Size{
		width:  645,
		height: 390,
	},

	customSize: Size{
		width:  480,
		height: 292,
	},

	fill: Fill{
		Fill:   "solid",
		Colour: "#000000",
		Alpha:  255,

		fillspec: wav2png.NewSolidFill(BLACK),
	},

	padding: Padding(2),

	palettes: struct {
		selected string
	}{
		selected: "palette1",
	},

	gridspec: wav2png.NewSquareGrid(GRID_COLOUR, GRID_SIZE, GRID_FIT, GRID_OVERLAY),

	antialias: Antialias{
		Type:   "vertical",
		kernel: wav2png.Vertical,
	},

	scale: Scale{
		Horizontal: 1.0,
		Vertical:   1.0,
	},
}

var cache = struct {
	palette wav2png.Palette
	from    *time.Duration
	to      *time.Duration
}{
	palette: wav2png.Ice,
}

func main() {
	c := make(chan bool)

	js.Global().Set("goInitialise", js.FuncOf(onInitialise))
	js.Global().Set("goAudio", js.FuncOf(onSetAudio))
	js.Global().Set("goSelect", js.FuncOf(onSelectAudio))
	js.Global().Set("goClear", js.FuncOf(clear))
	js.Global().Set("goSize", js.FuncOf(onSize))
	js.Global().Set("goCustomSize", js.FuncOf(onCustomSize))
	js.Global().Set("goSelectPalette", js.FuncOf(onSelectPalette))
	js.Global().Set("goFill", js.FuncOf(onFill))
	js.Global().Set("goGrid", js.FuncOf(onGrid))
	js.Global().Set("goPadding", js.FuncOf(onPadding))
	js.Global().Set("goAntialias", js.FuncOf(onAntialias))
	js.Global().Set("goScale", js.FuncOf(onScale))

	<-c
}

func float32ArrayToSlice(array js.Value) []float32 {
	u8array := js.Global().Get("Uint8Array").New(array)
	N := u8array.Length()
	buffer := make([]byte, N)
	floats := make([]float32, N/4)

	js.CopyBytesToGo(buffer, u8array)
	binary.Read(bytes.NewReader(buffer), binary.LittleEndian, floats)

	return floats
}

func bytesToArrayBuffer(bytes []byte) js.Value {
	var array js.Value = js.Global().Get("ArrayBuffer").New(len(bytes))
	var u8array js.Value = js.Global().Get("Uint8Array").New(array)

	js.CopyBytesToJS(u8array, bytes)

	return array
}

func arrayBufferToBytes(buffer js.Value) []byte {
	u8array := js.Global().Get("Uint8Array").New(buffer)
	N := u8array.Length()
	bytes := make([]byte, N)

	js.CopyBytesToGo(bytes, u8array)

	return bytes
}

func seconds(g float64) (time.Duration, *time.Duration) {
	t := time.Duration(g * float64(time.Second))

	return t, &t
}

func clean(v js.Value) string {
	return strings.ReplaceAll(strings.ToLower(v.String()), " ", "")
}
