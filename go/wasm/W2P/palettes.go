//go:build js && wasm
// +build js,wasm

package main

import (
	"bytes"
	"fmt"
	"image/png"
	"syscall/js"

	"github.com/transcriptaze/wav2png/wav2png"
)

type Palettes struct {
	Selected string            `json:"selected"`
	Palettes map[string][]byte `json:"palettes"`
}

func onPalette(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]
	tag := inputs[1].String()
	buffer := inputs[2]

	go func() {
		if !buffer.IsNull() {
			options.Palettes.Palettes[tag] = arrayBufferToBytes(buffer)
		} else {
			delete(options.Palettes.Palettes, tag)

			if options.Palettes.Selected == tag {
				options.Palettes.Selected = "palette1"
				cache.palette = wav2png.Ice
			}
		}

		if err := options.Palettes.save(); err != nil {
			callback.Invoke(err.Error())
		} else {
			callback.Invoke(js.Null())
		}
	}()

	return nil
}

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

			options.Palettes.Selected = tag.String()

			if err := redraw(); err != nil {
				callback.Invoke(err.Error())
			} else if err := options.Palettes.save(); err != nil {
				callback.Invoke(err.Error())
			} else {
				callback.Invoke(js.Null())
			}
		}
	}()

	return nil
}

func (p Palettes) save() error {
	return save(TagPalettes, p)
}

func (p *Palettes) restore() error {
	return restore(TagPalettes, p)
}
