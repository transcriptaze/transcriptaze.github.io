//go:build js && wasm
// +build js,wasm

// WASM interface for the midiasm functions
package main

import (
	"syscall/js"
)

const VERSION = "v0.2.0"

func main() {
	c := make(chan bool)

	js.Global().Set("goDisassemble", js.FuncOf(onDisassemble))

	<-c
}
