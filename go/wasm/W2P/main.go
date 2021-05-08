// +build js,wasm

// WASM interface for the taps2beats functions
package main

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"regexp"
	"strconv"
	"strings"
	"syscall/js"
	"time"

	"github.com/transcriptaze/wav2png/wav2png"
)

const VERSION = "v0.1.0"

var BACKGROUND = wav2png.NewSolidFill(color.NRGBA{R: 0x00, G: 0x00, B: 0x00, A: 255})
var GRID_COLOUR = color.NRGBA{R: 0x00, G: 0x80, B: 0x00, A: 255}

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

func main() {
	c := make(chan bool)

	js.Global().Set("goStore", js.FuncOf(store))
	js.Global().Set("goRender", js.FuncOf(render))
	js.Global().Set("goClear", js.FuncOf(clear))

	<-c
}

func store(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]
	buffer := inputs[1]

	go func() {
		sampleRate := buffer.Get("sampleRate").Float()
		length := buffer.Get("length").Int()
		duration := buffer.Get("duration").Float()
		channels := buffer.Get("numberOfChannels").Int()
		data := buffer.Call("getChannelData", 0)
		samples := float32ArrayToSlice(data.Get("buffer"))

		fmt.Printf(" sample rate: %v\n", sampleRate)
		fmt.Printf(" length:      %v\n", length)
		fmt.Printf(" duration:    %v\n", duration)
		fmt.Printf(" channels:    %v\n", channels)
		fmt.Printf(" samples:     %v\n", len(samples))

		wav = &audio{
			sampleRate: sampleRate,
			channels:   channels,
			duration:   time.Duration(duration * float64(time.Second)),
			length:     length,
			samples:    samples,
		}

		callback.Invoke(js.Null())
	}()

	return nil
}

func render(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]
	width := 645
	height := 390
	var gridspec wav2png.GridSpec = wav2png.NewSquareGrid(GRID_COLOUR, GRID_SIZE, 2, GRID_FIT, GRID_OVERLAY)
	var kernel wav2png.Kernel = wav2png.Soft

	if len(inputs) > 1 && !inputs[1].IsNaN() {
		width = inputs[1].Int()
	}

	if len(inputs) > 2 && !inputs[2].IsNaN() {
		height = inputs[2].Int()
	}

	if len(inputs) > 3 {
		gridspec = grid(inputs[3])
	}

	if len(inputs) > 4 {
		kernel = antialias(inputs[4])
	}

	go func() {
		if wav == nil {
			callback.Invoke(fmt.Errorf("Audio not loaded").Error(), js.Null())
			return
		}

		padding := gridspec.Padding()
		if padding < 0 {
			padding = 0
		}

		w := width - padding
		h := height - padding

		img := image.NewNRGBA(image.Rect(0, 0, width, height))
		grid := wav2png.Grid(gridspec, width, height)
		waveform := wav2png.Render(wav.duration, wav.samples, w, h)
		antialiased := wav2png.Antialias(waveform, kernel)

		origin := image.Pt(0, 0)
		rect := image.Rect(padding, padding, w, h)
		rectg := img.Bounds()

		wav2png.Fill(img, BACKGROUND)

		if gridspec.Overlay() {
			draw.Draw(img, rect, antialiased, origin, draw.Over)
			draw.Draw(img, rectg, grid, origin, draw.Over)
		} else {
			draw.Draw(img, rectg, grid, origin, draw.Over)
			draw.Draw(img, rect, antialiased, origin, draw.Over)
		}

		var b bytes.Buffer

		png.Encode(&b, img)

		callback.Invoke(js.Null(), bytesToArrayBuffer(b.Bytes()))
	}()

	return nil
}

func clear(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		wav = nil
		callback.Invoke(js.Null())
	}()

	return nil
}

func grid(object js.Value) wav2png.GridSpec {
	if !object.IsNull() {
		grid := object.Get("type").String()
		padding := 0
		colour := GRID_COLOUR
		size := GRID_SIZE
		width := GRID_WIDTH
		height := GRID_HEIGHT
		fit := GRID_FIT
		overlay := GRID_OVERLAY

		if p := object.Get("padding"); !p.IsNaN() {
			padding = p.Int()
		}

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
			return wav2png.NewNoGrid(padding)

		case "square":
			return wav2png.NewSquareGrid(colour, uint(size), padding, fit, overlay)

		case "rectangular":
			return wav2png.NewRectangularGrid(colour, uint(width), uint(height), padding, fit, overlay)
		}
	}

	return wav2png.NewSquareGrid(GRID_COLOUR, GRID_SIZE, 2, GRID_FIT, GRID_OVERLAY)
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
