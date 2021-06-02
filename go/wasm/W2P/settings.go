// +build js,wasm

package main

import (
	"encoding/json"
	"syscall/js"
)

type Tag int

const (
	TagSize Tag = iota
	TagPadding
	TagCustomSize
	TagPalettes
	TagFill
	TagGrid
	TagAntialias
	TagScale
)

func (t Tag) String() string {
	return "W2P." + [...]string{"size", "padding", "customSize", "palettes", "fill", "grid", "antialias", "scale"}[t]
}

func save(tag Tag, value interface{}) error {
	bytes, err := json.Marshal(value)
	if err != nil {
		return err
	}

	js.Global().
		Get("window").
		Get("localStorage").
		Call("setItem", tag.String(), string(bytes))

	return nil
}