package main

import (
	"bytes"
	"image"
	"image/draw"
	"image/png"
	"math"
	"syscall/js"

	"github.com/transcriptaze/wav2png/wav2png"
)

func redraw() error {
	if wav == nil {
		return nil
	}

	width := options.Size.width
	height := options.Size.height
	padding := int(options.Padding)
	fillspec := options.Fill.fillspec()
	gridspec := options.Grid.gridspec()
	kernel := options.Antialias.kernel
	vscale := options.Scale.Vertical

	w := width
	h := height
	if padding > 0 {
		w = width - padding
		h = height - padding
	}

	start := 0
	end := len(wav.samples)
	fs := wav.sampleRate

	if cache.from != nil {
		v := int(math.Floor(cache.from.Seconds() * fs))
		if v > 0 && v <= len(wav.samples) {
			start = v
		}
	}

	if cache.to != nil {
		v := int(math.Floor(cache.to.Seconds() * fs))
		if v < start {
			end = start
		} else if v <= len(wav.samples) {
			end = v
		}
	}

	samples := wav.samples[start:end]
	img := image.NewNRGBA(image.Rect(0, 0, width, height))
	grid := wav2png.Grid(gridspec, width, height, padding)
	waveform := wav2png.Render(samples, fs, w, h, cache.palette, vscale)
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

	js.Global().Call("onDraw", bytesToArrayBuffer(b.Bytes()), width, height)

	return nil
}
