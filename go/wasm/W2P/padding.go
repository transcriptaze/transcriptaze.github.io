package main

import (
	"syscall/js"
)

const PADDING = Padding(2)

type Padding int

func onPadding(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		options.padding.parse(inputs[1])

		if err := redraw(); err != nil {
			callback.Invoke(err.Error())
		} else if err := save(TagPadding, options.padding); err != nil {
			callback.Invoke(err.Error())
		} else {
			callback.Invoke(js.Null())
		}
	}()

	return nil
}

func (p *Padding) parse(object js.Value) {
	if !object.IsNull() && !object.IsUndefined() && !object.IsNaN() {
		v := object.Int()
		if v >= -16 && v <= 32 {
			*p = Padding(v)
		}
	}
}

func (p *Padding) restore() error {
	padding := int(options.padding)

	if err := restore(TagPadding, &padding); err != nil {
		return err
	}

	*p = Padding(padding)

	return nil
}
