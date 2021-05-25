// +build js,wasm

// WASM interface for the taps2beats functions
package main

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"image/color"
	"regexp"
	"strconv"
	"strings"
	"syscall/js"
	"time"

	"github.com/transcriptaze/wav2png/wav2png"
)

const VERSION = "v0.1.0"

var BLACK = color.NRGBA{R: 0x00, G: 0x00, B: 0x00, A: 255}
var DARKGREEN = color.NRGBA{R: 0x00, G: 0x80, B: 0x00, A: 255}

var FILL_COLOUR = BLACK
var GRID_COLOUR = DARKGREEN

const GRID_SIZE = 64
const GRID_WIDTH = 64
const GRID_HEIGHT = 48
const GRID_FIT = wav2png.Approximate
const GRID_OVERLAY = false
const PADDING = 0

type audio struct {
	sampleRate float64
	channels   int
	duration   time.Duration
	length     int
	samples    []float32
}

var wav *audio

var options = struct {
	from *time.Duration
	to   *time.Duration
}{}

var cache = struct {
	palette wav2png.Palette
}{
	palette: wav2png.Ice,
}

func main() {
	c := make(chan bool)

	js.Global().Set("goStore", js.FuncOf(store))
	js.Global().Set("goRender", js.FuncOf(render))
	js.Global().Set("goClear", js.FuncOf(clear))
	js.Global().Set("goPalette", js.FuncOf(palette))
	js.Global().Set("goSelect", js.FuncOf(selected))

	<-c
}

func fill(object js.Value) wav2png.FillSpec {
	if !object.IsNull() {
		fill := object.Get("type").String()
		colour := FILL_COLOUR

		if c := object.Get("colour"); !c.IsNull() && !c.IsUndefined() {
			s := strings.ToLower(c.String())
			if regexp.MustCompile("#[[:xdigit:]]{8}").MatchString(s) {
				red := uint8(0)
				green := uint8(0x80)
				blue := uint8(0)
				alpha := uint8(0xff)

				if _, err := fmt.Sscanf(s, "#%02x%02x%02x%02x", &red, &green, &blue, &alpha); err == nil {
					colour = color.NRGBA{R: red, G: green, B: blue, A: alpha}
				}
			}
		}

		switch fill {
		case "solid":
			return wav2png.NewSolidFill(colour)

		default:
			return wav2png.NewSolidFill(colour)
		}
	}

	return wav2png.NewSolidFill(FILL_COLOUR)
}

func grid(object js.Value) wav2png.GridSpec {
	if !object.IsNull() {
		grid := object.Get("type").String()
		colour := GRID_COLOUR
		size := GRID_SIZE
		width := GRID_WIDTH
		height := GRID_HEIGHT
		fit := GRID_FIT
		overlay := GRID_OVERLAY

		if c := object.Get("colour"); !c.IsNull() && !c.IsUndefined() {
			s := strings.ToLower(c.String())
			if regexp.MustCompile("#[[:xdigit:]]{8}").MatchString(s) {
				red := uint8(0)
				green := uint8(0x80)
				blue := uint8(0)
				alpha := uint8(0xff)

				if _, err := fmt.Sscanf(s, "#%02x%02x%02x%02x", &red, &green, &blue, &alpha); err == nil {
					colour = color.NRGBA{R: red, G: green, B: blue, A: alpha}
				}
			}
		}

		if sz := object.Get("size"); !sz.IsNull() && !sz.IsUndefined() {
			if matched := regexp.MustCompile(`([~=><≥≤]).*`).FindStringSubmatch(sz.String()); matched != nil && len(matched) == 2 {
				switch matched[1] {
				case "~":
					fit = wav2png.Approximate
				case "=":
					fit = wav2png.Exact
				case ">":
					fit = wav2png.AtLeast
					size += 1
				case "<":
					fit = wav2png.AtMost
					size -= 1
				case "≥":
					fit = wav2png.AtLeast
				case "≤":
					fit = wav2png.AtMost
				}
			}

			if matched := regexp.MustCompile(`([~=><≥≤])?\s*([0-9]+)`).FindStringSubmatch(sz.String()); matched != nil && len(matched) == 3 {
				if v, err := strconv.ParseInt(matched[2], 10, 32); err == nil && v >= 16 && v <= 1024 {
					size = int(v)
				}
			}

			if matched := regexp.MustCompile(`([~=><≥≤])?\s*([0-9]+)x([0-9]+)`).FindStringSubmatch(sz.String()); matched != nil && len(matched) == 4 {
				if v, err := strconv.ParseInt(matched[2], 10, 32); err == nil && v >= 16 && v <= 1024 {
					width = int(v)
				}

				if v, err := strconv.ParseInt(matched[3], 10, 32); err == nil && v >= 16 && v <= 1024 {
					height = int(v)
				}
			}
		}

		if o := object.Get("overlay"); !o.IsNull() && !o.IsUndefined() {
			overlay = o.Bool()
		}

		switch grid {
		case "none":
			return wav2png.NewNoGrid()

		case "square":
			return wav2png.NewSquareGrid(colour, uint(size), fit, overlay)

		case "rectangular":
			return wav2png.NewRectangularGrid(colour, uint(width), uint(height), fit, overlay)
		}
	}

	return wav2png.NewSquareGrid(GRID_COLOUR, GRID_SIZE, GRID_FIT, GRID_OVERLAY)
}

func antialias(object js.Value) wav2png.Kernel {
	if !object.IsNull() {
		kernel := object.Get("type").String()

		switch kernel {
		case "none":
			return wav2png.None

		case "vertical":
			return wav2png.Vertical

		case "horizontal":
			return wav2png.Horizontal

		case "soft":
			return wav2png.Soft
		}
	}

	return wav2png.Soft
}

func scale(object js.Value) float64 {
	vscale := 1.0
	if !object.IsNull() {
		if v := object.Get("vertical"); !v.IsNull() && !v.IsNaN() {
			if vv := v.Float(); vv >= 0.25 && vv <= 4.0 {
				vscale = vv
			}
		}
	}

	return vscale
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
