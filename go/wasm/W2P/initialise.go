// +build js,wasm

package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"
)

func onInitialise(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		if err := options.size.restore(TagSize); err != nil {
			fmt.Printf("%v\n", err)
		}

		if err := options.customSize.restore(TagCustomSize); err != nil {
			fmt.Printf("%v\n", err)
		}

		if err := options.fill.restore(); err != nil {
			fmt.Printf("%v\n", err)
		}

		if err := options.padding.restore(); err != nil {
			fmt.Printf("%v\n", err)
		}

		if err := options.scale.restore(); err != nil {
			fmt.Printf("%v\n", err)
		}

		if err := options.antialias.restore(); err != nil {
			fmt.Printf("%v\n", err)
		}

		settings := struct {
			Size       Size      `json:"size"`
			CustomSize Size      `json:"customSize"`
			Fill       Fill      `json:"fill"`
			Padding    Padding   `json:"padding"`
			Antialias  Antialias `json:"antialias"`
			Scale      Scale     `json:"scale"`
		}{
			Size:       options.size,
			CustomSize: options.customSize,
			Fill:       options.fill,
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
