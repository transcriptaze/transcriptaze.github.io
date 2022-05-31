//go:build js && wasm
// +build js,wasm

// WASM interface for the midiasm functions
package main

import (
	"encoding/json"
	"syscall/js"
)

const VERSION = "v0.2.0"

func main() {
	c := make(chan bool)

	js.Global().Set("goDisassemble", js.FuncOf(onDisassemble))

	<-c
}

func arrayBufferToBytes(buffer js.Value) []byte {
	u8array := js.Global().Get("Uint8Array").New(buffer)
	N := u8array.Length()
	bytes := make([]byte, N)

	js.CopyBytesToGo(bytes, u8array)

	return bytes
}

func marshal(object any) (js.Value, error) {
	if object != nil {
		bytes, err := json.Marshal(object)
		if err != nil {
			return js.Null(), err
		}

		return js.Global().Get("JSON").Call("parse", string(bytes)), nil
	}

	return js.Null(), nil
}
