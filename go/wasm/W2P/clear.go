// +build js,wasm

package main

import (
	"syscall/js"
)

func clear(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		wav = nil

		options.from = nil
		options.to = nil

		callback.Invoke(js.Null())
	}()

	return nil
}
