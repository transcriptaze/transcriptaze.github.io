//go:build js && wasm
// +build js,wasm

package main

import (
	"syscall/js"

	"github.com/twystd/midiasm/midi/encoding/midifile"
)

type SMF struct {
	MThd Item `json:"MThd"`
}

type Item struct {
	Bytes []byte `json:"bytes"`
}

func onDisassemble(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]
	buffer := inputs[1]

	go func() {
		bytes := arrayBufferToBytes(buffer)

		decoder := midifile.NewDecoder()

		if smf, err := decoder.Decode(bytes); err != nil {
			callback.Invoke(err.Error())
		} else if smf == nil {
			callback.Invoke("Unable to decode MIDI file")
		} else if errors := smf.Validate(); len(errors) > 0 {
			callback.Invoke(errors[0].Error())
		} else {
			object := SMF{
				MThd: Item{
					Bytes: []byte{},
				},
			}

			callback.Invoke(marshal(object), js.Null())
		}
	}()

	return nil
}
