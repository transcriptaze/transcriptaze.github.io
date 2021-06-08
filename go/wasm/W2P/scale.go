// +build js,wasm

package main

import (
	"syscall/js"
)

type Scale struct {
	Horizontal float64 `json:"horizontal"`
	Vertical   float64 `json:"vertical"`
}

var SCALE = Scale{
	Horizontal: 1.0,
	Vertical:   1.0,
}

func onScale(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		options.scale.parse(inputs[1], inputs[2])

		if err := redraw(); err != nil {
			callback.Invoke(err.Error())
		} else if err := save(TagScale, options.scale); err != nil {
			callback.Invoke(err.Error())
		} else {
			callback.Invoke(js.Null())
		}
	}()

	return nil
}

func (s *Scale) parse(horizontal, vertical js.Value) {
	vscale := options.scale.Vertical

	if !vertical.IsNull() && !vertical.IsNaN() {
		if v := vertical.Float(); v >= 0.25 && v <= 4.0 {
			vscale = v
		}
	}

	s.Horizontal = 1.0
	s.Vertical = vscale
}

func (s *Scale) restore() error {
	scale := options.scale

	if err := restore(TagScale, &scale); err != nil {
		return err
	}

	*s = scale

	return nil
}
