// +build js,wasm

// WASM interface for the taps2beats functions
package main

import (
	"bytes"
	"fmt"
	"image/png"
	"syscall/js"

	"github.com/transcriptaze/wav2png/wav2png"
)

func palette(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]
	buffer := inputs[1]

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

			callback.Invoke(js.Null())
		}
	}()

	return nil
}
