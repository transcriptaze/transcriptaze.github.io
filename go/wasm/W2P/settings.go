//go:build js && wasm
// +build js,wasm

package main

import (
	"encoding/json"
	"syscall/js"
)

type Tag int

const (
	TagSize Tag = iota
	TagCustomSize
	TagPadding
	TagPalettes
	TagFill
	TagGrid
	TagAntialias
	TagScale
)

func (t Tag) String() string {
	return "W2P." + [...]string{"size", "customSize", "padding", "palettes", "fill", "grid", "antialias", "scale"}[t]
}

func save(tag Tag, value interface{}) error {
	var bytes []byte

	switch v := value.(type) {
	case string:
		bytes = []byte(v)

	default:
		b, err := json.Marshal(value)
		if err != nil {
			return err
		} else {
			bytes = b
		}
	}

	js.Global().
		Get("window").
		Get("localStorage").
		Call("setItem", tag.String(), string(bytes))

	return nil
}

func restore(tag Tag, value interface{}) error {
	blob := js.Global().
		Get("window").
		Get("localStorage").
		Call("getItem", tag.String())

	bytes := []byte(blob.String())

	switch v := value.(type) {
	case *string:
		*v = string(bytes)

	default:
		if err := json.Unmarshal(bytes, v); err != nil {
			return err
		}
	}

	return nil
}
