package main

import (
	"strings"
	"syscall/js"

	"github.com/transcriptaze/wav2png/wav2png"
)

func onAntialias(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		kernel, settings := antialias(inputs[1])

		options.antialias = kernel

		if err := redraw(); err != nil {
			callback.Invoke(err.Error())
		} else if err := save(TagAntialias, settings); err != nil {
			callback.Invoke(err.Error())
		} else {
			callback.Invoke(js.Null())
		}
	}()

	return nil
}

func antialias(object js.Value) (wav2png.Kernel, interface{}) {
	kernel := wav2png.Vertical

	settings := struct {
		Kernel string `json:"type"`
	}{
		Kernel: "vertical",
	}

	clean := func(v js.Value) string {
		return strings.ReplaceAll(strings.ToLower(v.String()), " ", "")
	}

	if !object.IsNull() {
		k := clean(object.Get("type"))

		switch k {
		case "none":
			settings.Kernel = "none"
			kernel = wav2png.None

		case "vertical":
			settings.Kernel = "vertical"
			kernel = wav2png.Vertical

		case "horizontal":
			settings.Kernel = "horizontal"
			kernel = wav2png.Horizontal

		case "soft":
			settings.Kernel = "soft"
			kernel = wav2png.Soft
		}
	}

	return kernel, settings
}
