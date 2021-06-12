package main

import (
	"syscall/js"
)

type Padding int

func onPadding(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		options.Padding.parse(inputs[1])

		if err := redraw(); err != nil {
			callback.Invoke(err.Error())
		} else if err := options.Padding.save(); err != nil {
			callback.Invoke(err.Error())
		} else {
			callback.Invoke(js.Null())
		}
	}()

	return nil
}

func (p *Padding) parse(object js.Value) {
	if object.Type() == js.TypeNumber && !object.IsNaN() {
		v := object.Int()
		if v >= -16 && v <= 32 {
			*p = Padding(v)
		}
	}
}

func (p *Padding) save() error {
	return save(TagPadding, p)
}

func (p *Padding) restore() error {
	padding := int(options.Padding)

	if err := restore(TagPadding, &padding); err != nil {
		return err
	}

	*p = Padding(padding)

	return nil
}
