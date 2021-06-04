// +build js,wasm

package main

import (
	"bytes"
	"fmt"
	"image"
	"image/draw"
	"image/png"
	"math"
	"syscall/js"

	"github.com/transcriptaze/wav2png/wav2png"
)

func render(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	width := options.width
	height := options.height
	padding := options.padding
	fillspec := options.fillspec
	gridspec := options.gridspec
	kernel := options.antialias
	vscale := options.vscale

	go func() {
		if wav == nil {
			callback.Invoke(fmt.Errorf("Audio not loaded").Error(), js.Null())
			return
		}

		w := width
		h := height
		if padding > 0 {
			w = width - padding
			h = height - padding
		}

		start := 0
		end := len(wav.samples)
		fs := wav.sampleRate

		if options.from != nil {
			v := int(math.Floor(options.from.Seconds() * fs))
			if v > 0 && v <= len(wav.samples) {
				start = v
			}
		}

		if options.to != nil {
			v := int(math.Floor(options.to.Seconds() * fs))
			if v < start {
				end = start
			} else if v <= len(wav.samples) {
				end = v
			}
		}

		samples := wav.samples[start:end]
		duration, _ := seconds(float64(len(samples)) / fs)

		img := image.NewNRGBA(image.Rect(0, 0, width, height))
		grid := wav2png.Grid(gridspec, width, height, padding)
		waveform := wav2png.Render(duration, samples, w, h, cache.palette, vscale)
		antialiased := wav2png.Antialias(waveform, kernel)

		origin := image.Pt(0, 0)
		rect := image.Rect(padding, padding, w, h)
		rectg := img.Bounds()

		wav2png.Fill(img, fillspec)

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
