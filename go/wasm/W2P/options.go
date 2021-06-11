// +build js,wasm

package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"

	"github.com/transcriptaze/wav2png/wav2png"
)

type Options struct {
	Size       Size      `json:"size"`
	CustomSize Size      `json:"customSize"`
	Palettes   Palettes  `json:"palettes"`
	Fill       Fill      `json:"fill"`
	Padding    Padding   `json:"padding"`
	Grid       Grid      `json:"grid"`
	Antialias  Antialias `json:"antialias"`
	Scale      Scale     `json:"scale"`
}

var options = Options{
	Size: Size{
		width:  645,
		height: 390,
	},

	CustomSize: Size{
		width:  480,
		height: 292,
	},

	Palettes: Palettes{
		Selected: "palette1",
		Palettes: map[string][]byte{},
	},

	Fill: Fill{
		Fill:   "solid",
		Colour: "#000000",
		Alpha:  255,
	},

	Padding: Padding(2),

	Grid: Grid{
		Grid:   "square",
		Colour: "#008000",
		Alpha:  255,
		Size:   "~64",
		WH:     "~64x48",
	},

	Antialias: Antialias{
		Type:   "vertical",
		kernel: wav2png.Vertical,
	},

	Scale: Scale{
		Horizontal: 1.0,
		Vertical:   1.0,
	},
}

func onInitialise(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		if err := options.Size.restore(TagSize); err != nil {
			fmt.Printf("%v\n", err)
		}

		if err := options.CustomSize.restore(TagCustomSize); err != nil {
			fmt.Printf("%v\n", err)
		}

		if err := options.Palettes.restore(); err != nil {
			fmt.Printf("%v\n", err)
		}

		if err := options.Fill.restore(); err != nil {
			fmt.Printf("%v\n", err)
		}

		if err := options.Padding.restore(); err != nil {
			fmt.Printf("%v\n", err)
		}

		if err := options.Grid.restore(); err != nil {
			fmt.Printf("%v\n", err)
		}

		if err := options.Scale.restore(); err != nil {
			fmt.Printf("%v\n", err)
		}

		if err := options.Antialias.restore(); err != nil {
			fmt.Printf("%v\n", err)
		}

		bytes, err := json.Marshal(options)
		if err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		object := js.Global().Get("JSON").Call("parse", string(bytes))

		callback.Invoke(js.Null(), object)
	}()

	return nil
}
