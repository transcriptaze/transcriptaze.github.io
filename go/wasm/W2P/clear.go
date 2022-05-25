//go:build js && wasm
// +build js,wasm

package main

import (
	"syscall/js"
)

func clear(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		wav = nil

		cache.from = nil
		cache.to = nil

		callback.Invoke(js.Null())
	}()

	return nil
}
