package main

import (
	"syscall/js"
)

const PADDING = 2

func onPadding(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		v, settings := padding(inputs[1])

		options.padding = v

		if err := redraw(); err != nil {
			callback.Invoke(err.Error())
		} else if err := save(TagPadding, settings); err != nil {
			callback.Invoke(err.Error())
		} else {
			callback.Invoke(js.Null())
		}
	}()

	return nil
}

func padding(object js.Value) (int, interface{}) {
	padding := options.padding

	if !object.IsNull() && !object.IsUndefined() && !object.IsNaN() {
		v := object.Int()
		if v >= -16 && v <= 32 {
			padding = v
		}
	}

	return padding, padding
}
