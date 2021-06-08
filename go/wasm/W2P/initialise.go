// +build js,wasm

package main

import (
	"encoding/json"
	"syscall/js"
)

func onInitialise(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		if err := options.padding.restore(); err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		if err := options.scale.restore(); err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		settings := struct {
			Padding Padding `json:"padding"`
			Scale   Scale   `json:"scale"`
		}{
			Padding: options.padding,
			Scale:   options.scale,
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
