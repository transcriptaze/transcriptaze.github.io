// +build js,wasm

package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"

	"github.com/transcriptaze/wav2png/wav2png"
)

type Options struct {
	size       Size
	customSize Size
	padding    Padding
	fill       Fill
	palettes   Palettes
	grid       Grid
	antialias  Antialias
	scale      Scale
}

var options = Options{
	size: Size{
		width:  645,
		height: 390,
	},

	customSize: Size{
		width:  480,
		height: 292,
	},

	palettes: Palettes{
		Selected: "palette1",
		Palettes: map[string][]byte{},
	},

	fill: Fill{
		Fill:   "solid",
		Colour: "#000000",
		Alpha:  255,
	},

	padding: Padding(2),

	grid: Grid{
		Grid:   "square",
		Colour: "#008000",
		Alpha:  255,
		Size:   "~64",
		WH:     "~64x48",
	},

	antialias: Antialias{
		Type:   "vertical",
		kernel: wav2png.Vertical,
	},

	scale: Scale{
		Horizontal: 1.0,
		Vertical:   1.0,
	},
}

func onInitialise(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		if err := options.size.restore(TagSize); err != nil {
			fmt.Printf("%v\n", err)
		}

		if err := options.customSize.restore(TagCustomSize); err != nil {
			fmt.Printf("%v\n", err)
		}

		if err := options.palettes.restore(); err != nil {
			fmt.Printf("%v\n", err)
		}

		if err := options.fill.restore(); err != nil {
			fmt.Printf("%v\n", err)
		}

		if err := options.padding.restore(); err != nil {
			fmt.Printf("%v\n", err)
		}

		if err := options.grid.restore(); err != nil {
			fmt.Printf("%v\n", err)
		}

		if err := options.scale.restore(); err != nil {
			fmt.Printf("%v\n", err)
		}

		if err := options.antialias.restore(); err != nil {
			fmt.Printf("%v\n", err)
		}

		settings := struct {
			Size       Size      `json:"size"`
			CustomSize Size      `json:"customSize"`
			Palettes   Palettes  `json:"palettes"`
			Fill       Fill      `json:"fill"`
			Padding    Padding   `json:"padding"`
			Grid       Grid      `json:"grid"`
			Antialias  Antialias `json:"antialias"`
			Scale      Scale     `json:"scale"`
		}{
			Size:       options.size,
			CustomSize: options.customSize,
			Palettes:   options.palettes,
			Fill:       options.fill,
			Padding:    options.padding,
			Grid:       options.grid,
			Antialias:  options.antialias,
			Scale:      options.scale,
		}

		bytes, err := json.Marshal(settings)
		if err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		object := js.Global().Get("JSON").Call("parse", string(bytes))

		callback.Invoke(js.Null(), object)
	}()

	return nil
}
