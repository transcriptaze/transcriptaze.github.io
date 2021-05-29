// +build js,wasm

// WASM interface for the taps2beats functions
package main

import (
	"syscall/js"
)

func onScale(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		cache.hscale = scale(inputs[1])
		cache.vscale = scale(inputs[2])

		if err := redraw(); err != nil {
			callback.Invoke(err.Error())
		} else {
			callback.Invoke(js.Null())
		}
	}()

	return nil
}

func scale(object js.Value) float64 {
		if !object.IsNull() && !object.IsNaN() {
			if v := object.Float(); v >= 0.25 && v <= 4.0 {
				return v
			}
		}

	return 1.0
}
