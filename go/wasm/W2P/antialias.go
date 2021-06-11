package main

import (
	"syscall/js"

	"github.com/transcriptaze/wav2png/wav2png"
)

type Antialias struct {
	Type   string `json:"type"`
	kernel wav2png.Kernel
}

func onAntialias(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		options.Antialias.parse(inputs[1])

		if err := redraw(); err != nil {
			callback.Invoke(err.Error())
		} else if err := options.Antialias.save(); err != nil {
			callback.Invoke(err.Error())
		} else {
			callback.Invoke(js.Null())
		}
	}()

	return nil
}

func (a *Antialias) parse(object js.Value) {
	if !object.IsNull() {
		k := clean(object.Get("type"))

		switch k {
		case "none":
			a.Type = "none"
			a.kernel = wav2png.None

		case "vertical":
			a.Type = "vertical"
			a.kernel = wav2png.Vertical

		case "horizontal":
			a.Type = "horizontal"
			a.kernel = wav2png.Horizontal

		case "soft":
			a.Type = "soft"
			a.kernel = wav2png.Soft
		}
	}
}

func (a *Antialias) save() error {
	return save(TagAntialias, a)
}

func (a *Antialias) restore() error {
	antialias := options.Antialias

	if err := restore(TagAntialias, &antialias); err != nil {
		return err
	}

	*a = antialias

	return nil
}
