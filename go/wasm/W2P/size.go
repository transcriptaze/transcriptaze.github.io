// +build js,wasm

package main

import (
	"fmt"
	"syscall/js"
)

const WIDTH = 645
const HEIGHT = 390

func onSize(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		width, height, settings := size(inputs[1], inputs[2])

		options.width = width
		options.height = height

		if err := redraw(); err != nil {
			callback.Invoke(err.Error())
		} else if err := save(TagSize, settings); err != nil {
			callback.Invoke(err.Error())
		} else {
			callback.Invoke(js.Null())
		}
	}()

	return nil
}

func onCustomSize(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		width, height, settings := size(inputs[1], inputs[2])

		options.width = width
		options.height = height

		if err := redraw(); err != nil {
			callback.Invoke(err.Error())
		} else if err := save(TagCustomSize, settings); err != nil {
			callback.Invoke(err.Error())
		} else {
			callback.Invoke(js.Null())
		}
	}()

	return nil
}

func size(width, height js.Value) (int, int, interface{}) {
	w := options.width
	h := options.height

	if !width.IsNull() && !width.IsNaN() {
		if v := width.Int(); v > 32 && v <= 8192 {
			w = v
		}
	}

	if !height.IsNull() && !height.IsNaN() {
		if v := height.Int(); v > 32 && v <= 8192 {
			h = v
		}
	}

	return w, h, fmt.Sprintf("%dx%d", w, h)
}
