// +build js,wasm

package main

import (
	"encoding/json"
	"syscall/js"
)

func onInitialise(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		if err := options.size.restore(TagSize); err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		if err := options.customSize.restore(TagCustomSize); err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		if err := options.padding.restore(); err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		if err := options.scale.restore(); err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		if err := options.antialias.restore(); err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		settings := struct {
			Size       Size      `json:"size"`
			CustomSize Size      `json:"customSize"`
			Padding    Padding   `json:"padding"`
			Antialias  Antialias `json:"antialias"`
			Scale      Scale     `json:"scale"`
		}{
			Size:       options.size,
			CustomSize: options.customSize,
			Padding:    options.padding,
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
