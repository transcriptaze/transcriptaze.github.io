// +build js,wasm

package main

import (
	"fmt"
	"syscall/js"
	"time"
)

func onSetAudio(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]
	buffer := inputs[1]

	go func() {
		sampleRate := buffer.Get("sampleRate").Float()
		length := buffer.Get("length").Int()
		duration := buffer.Get("duration").Float()
		channels := buffer.Get("numberOfChannels").Int()
		data := buffer.Call("getChannelData", 0)
		samples := float32ArrayToSlice(data.Get("buffer"))

		fmt.Printf(" sample rate: %v\n", sampleRate)
		fmt.Printf(" length:      %v\n", length)
		fmt.Printf(" duration:    %v\n", duration)
		fmt.Printf(" channels:    %v\n", channels)
		fmt.Printf(" samples:     %v\n", len(samples))

		wav = &audio{
			sampleRate: sampleRate,
			channels:   channels,
			duration:   time.Duration(duration * float64(time.Second)),
			length:     length,
			samples:    samples,
		}

		if err := redraw(); err != nil {
			callback.Invoke(err.Error())
		} else {
			callback.Invoke(js.Null())
		}
	}()

	return nil
}

func onSelectAudio(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]
	from := inputs[1]
	to := inputs[2]

	go func() {
		if from.IsUndefined() || from.IsNull() || from.IsNaN() {
			options.from = nil
		} else {
			_, options.from = seconds(from.Float())
		}

		if to.IsUndefined() || to.IsNull() || to.IsNaN() {
			options.to = nil
		} else {
			_, options.to = seconds(to.Float())
		}

		if err := redraw(); err != nil {
			callback.Invoke(err.Error())
		} else {
			callback.Invoke(js.Null())
		}
	}()

	return nil
}
