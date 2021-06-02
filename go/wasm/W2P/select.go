// +build js,wasm

package main

import (
	"syscall/js"
)

func selected(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]
	from := inputs[1]
	to := inputs[2]

	go func() {
		if from.IsUndefined() || from.IsNull() || from.IsNaN() {
			options.from = nil
		} else {
			_, options.from = seconds(from.Float())
		}

		if to.IsUndefined() || to.IsNull() || to.IsNaN() {
			options.to = nil
		} else {
			_, options.to = seconds(to.Float())
		}

		callback.Invoke(js.Null())
	}()

	return nil
}
