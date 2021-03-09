// +build js,wasm

// WASM interface for the taps2beats functions
package main

import (
	"encoding/json"
	"syscall/js"

	"github.com/transcriptaze/taps2beats/taps2beats"
)

const VERSION = "v0.1.0"

func main() {
	c := make(chan bool)

	js.Global().Set("goTaps", js.FuncOf(taps))

	<-c
}

func taps(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]
	object := inputs[1]
	duration := inputs[2].Float()
	quantize := inputs[3].Bool()
	interpolate := inputs[4].Bool()

	go func() {
		taps := [][]float64{}

		if err := unmarshal(object, &taps); err != nil {
			callback.Invoke(err.Error())
			return
		}

		beats := taps2beats.Taps2Beats(taps2beats.Floats2Seconds(taps), 0.0)

		if len(beats.Beats) > 1 && beats.Variance != nil && *beats.Variance < 0.1 {			
			cleaned,err := beats.Clean()
			if err != nil {
					callback.Invoke(js.Null(), err.Error())
					return
			}

			if quantize {
				if err := cleaned.Quantize(); err != nil {
					callback.Invoke(js.Null(), err.Error())
					return
				}
			}

			if interpolate {
				start := taps2beats.Seconds(0.0)
				end := taps2beats.Seconds(duration)
				if err := cleaned.Interpolate(start, end); err != nil {
					callback.Invoke(js.Null(), err.Error())
					return
				}
			}

			callback.Invoke(marshal(cleaned), js.Null())
			return
		}

		callback.Invoke(js.Null(), js.Null())
	}()

	return nil
}

func marshal(p interface{}) js.Value {
	if p == nil {
		return js.Null()
	}

	bytes, err := json.Marshal(p)
	if err != nil {
		return js.Null()
	}

	return js.Global().Get("JSON").Call("parse", string(bytes))
}

func unmarshal(v js.Value, p interface{}) error {
	s := js.Global().Get("JSON").Call("stringify", v).String()

	return json.Unmarshal([]byte(s), p)
}
