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
	"syscall/js"
	"time"

	"github.com/transcriptaze/wav2png/wav2png"
)

const VERSION = "v0.1.0"

var BACKGROUND = wav2png.NewSolidFill(color.NRGBA{R: 0x00, G: 0x00, B: 0x00, A: 255})
var GRID_COLOUR = color.NRGBA{R: 0x00, G: 0x80, B: 0x00, A: 255}

const GRID_SIZE = 64
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
	width := inputs[1].Int()
	height := inputs[2].Int()
	padding := inputs[3].Int()

	if padding < 0 {
		padding = 0
	}

	go func() {
		if wav == nil {
			callback.Invoke(fmt.Errorf("Audio not loaded").Error(), js.Null())
			return
		}

		gridspec := wav2png.NewSquareGrid(GRID_COLOUR, GRID_SIZE, padding)
		w := width - 2*padding
		h := height - 2*padding

		img := image.NewNRGBA(image.Rect(0, 0, width, height))
		wav2png.Fill(img, BACKGROUND)
		wav2png.Grid(img, gridspec)

		waveform := wav2png.Render(wav.duration, wav.samples, w, h)
		antialiased := wav2png.Antialias(waveform, wav2png.Soft)

		origin := image.Pt(0, 0)
		rect := image.Rect(padding, padding, w, h)
		draw.Draw(img, rect, antialiased, origin, draw.Over)

		var b bytes.Buffer

		png.Encode(&b, img)

		callback.Invoke(js.Null(), bytesToArrayBuffer(b.Bytes()))
	}()

	return nil
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
