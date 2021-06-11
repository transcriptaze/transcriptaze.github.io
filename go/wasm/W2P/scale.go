// +build js,wasm

package main

import (
	"syscall/js"
)

type Scale struct {
	Horizontal float64 `json:"horizontal"`
	Vertical   float64 `json:"vertical"`
}

func onScale(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		options.Scale.parse(inputs[1], inputs[2])

		if err := redraw(); err != nil {
			callback.Invoke(err.Error())
		} else if err := options.Scale.save(); err != nil {
			callback.Invoke(err.Error())
		} else {
			callback.Invoke(js.Null())
		}
	}()

	return nil
}

func (s *Scale) parse(horizontal, vertical js.Value) {
	vscale := options.Scale.Vertical

	if !vertical.IsNull() && !vertical.IsNaN() {
		if v := vertical.Float(); v >= 0.25 && v <= 4.0 {
			vscale = v
		}
	}

	s.Horizontal = 1.0
	s.Vertical = vscale
}

func (s *Scale) save() error {
	return save(TagScale, s)
}

func (s *Scale) restore() error {
	scale := options.Scale

	if err := restore(TagScale, &scale); err != nil {
		return err
	}

	*s = scale

	return nil
}
