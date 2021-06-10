package main

import (
	"fmt"
	"image/color"
	"regexp"
	"syscall/js"

	"github.com/transcriptaze/wav2png/wav2png"
)

type Fill struct {
	Fill   string `json:"fill"`
	Colour string `json:"colour"`
	Alpha  uint8  `json:"alpha"`
}

func onFill(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		options.fill.parse(inputs[1])

		if err := redraw(); err != nil {
			callback.Invoke(err.Error())
		} else if err := options.fill.save(); err != nil {
			callback.Invoke(err.Error())
		} else {
			callback.Invoke(js.Null())
		}
	}()

	return nil
}

func (f *Fill) parse(object js.Value) {
	if !object.IsNull() {
		f.Fill = clean(object.Get("fill"))

		if c := object.Get("colour"); !c.IsNull() && !c.IsUndefined() {
			s := clean(c)
			if regexp.MustCompile("#[[:xdigit:]]{8}").MatchString(s) {
				red := uint8(0)
				green := uint8(0x0)
				blue := uint8(0)
				alpha := uint8(0xff)

				if _, err := fmt.Sscanf(s, "#%02x%02x%02x%02x", &red, &green, &blue, &alpha); err == nil {
					f.Colour = fmt.Sprintf("#%02x%02x%02x", red, green, blue)
					f.Alpha = alpha
				}
			}
		}
	}
}

func (f *Fill) save() error {
	return save(TagFill, f)
}

func (f *Fill) restore() error {
	fill := options.fill

	if err := restore(TagFill, &fill); err != nil {
		return err
	}

	*f = fill

	return nil
}

func (f *Fill) fillspec() wav2png.FillSpec {
	// ... colour
	red := uint8(0)
	green := uint8(0)
	blue := uint8(0)
	alpha := f.Alpha
	colour := color.NRGBA{R: red, G: green, B: blue, A: alpha}

	if _, err := fmt.Sscanf(f.Colour, "#%02x%02x%02x", &red, &green, &blue); err == nil {
		colour = color.NRGBA{R: red, G: green, B: blue, A: f.Alpha}
	}

	return wav2png.NewSolidFill(colour)
}
