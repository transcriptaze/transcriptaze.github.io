//go:build js && wasm
// +build js,wasm

package main

import (
	"fmt"
	"syscall/js"

	"github.com/twystd/midiasm/midi/encoding/midifile"
)

//	"MThd": `{{pad (ellipsize .Bytes 42) 42}}  {{.Tag}} length:{{.Length}}, format:{{.Format}}, tracks:{{.Tracks}}, {{if not .SMPTETimeCode }}metrical time:{{.PPQN}} ppqn{{else}}SMPTE:{{.FPS}} fps,{{.SubFrames}} sub-frames{{end}}`,

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
			callback.Invoke(js.Null(), errors[0].Error())
		} else {
			object := SMF{}

			if smf.MThd != nil {
				mthd := MThd{
					Bytes:  Hex(smf.MThd.Bytes),
					Detail: fmt.Sprintf("length:%v, format:%v, tracks:%v, ", smf.MThd.Length, smf.MThd.Format, smf.MThd.Tracks),
				}

				object.MThd = &mthd
			}

			if json, err := marshal(object); err != nil {
				callback.Invoke(js.Null(), err.Error())
			} else {
				callback.Invoke(json, js.Null())
			}
		}
	}()

	return nil
}
