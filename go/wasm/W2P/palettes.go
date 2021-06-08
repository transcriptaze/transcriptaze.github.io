// +build js,wasm

package main

import (
	"bytes"
	"fmt"
	"image/png"
	"syscall/js"

	"github.com/transcriptaze/wav2png/wav2png"
)

func onSelectPalette(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]
	tag := inputs[1]
	buffer := inputs[2]

	go func() {
		b := bytes.NewBuffer(arrayBufferToBytes(buffer))

		if img, err := png.Decode(b); err != nil {
			callback.Invoke(fmt.Errorf("Error decoding palette PNG").Error())
		} else if p, err := wav2png.PaletteFromPng(img); err != nil {
			callback.Invoke(err.Error())
		} else if p == nil {
			callback.Invoke(fmt.Errorf("Error creating palette from PNG").Error())
		} else {
			cache.palette = *p

			options.palettes.selected = tag.String()

			if err := redraw(); err != nil {
				callback.Invoke(err.Error())
			} else {
				callback.Invoke(js.Null())
			}
		}
	}()

	return nil
}
