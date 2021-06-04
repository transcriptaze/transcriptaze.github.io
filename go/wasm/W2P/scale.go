// +build js,wasm

package main

import (
	"syscall/js"
)

const HSCALE = 1.0
const VSCALE = 1.0

func onScale(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		hscale, vscale, settings := scale(inputs[1], inputs[2])

		options.hscale = hscale
		options.vscale = vscale

		if err := redraw(); err != nil {
			callback.Invoke(err.Error())
		} else if err := save(TagScale, settings); err != nil {
			callback.Invoke(err.Error())
		} else {
			callback.Invoke(js.Null())
		}
	}()

	return nil
}

func scale(horizontal, vertical js.Value) (float64, float64, interface{}) {
	vscale := options.vscale

	if !vertical.IsNull() && !vertical.IsNaN() {
		if v := vertical.Float(); v >= 0.25 && v <= 4.0 {
			vscale = v
		}
	}

	return 1.0, vscale, scaleSettings(horizontal, vertical)
}

func scaleSettings(horizontal, vertical js.Value) interface{} {
	settings := struct {
		Horizontal float64 `json:"horizontal"`
		Vertical   float64 `json:"vertical"`
	}{
		Horizontal: 1.0,
		Vertical:   options.vscale,
	}

	if !vertical.IsNull() && !vertical.IsNaN() {
		if v := vertical.Float(); v >= 0.25 && v <= 4.0 {
			settings.Vertical = v
		}
	}

	return settings
}
