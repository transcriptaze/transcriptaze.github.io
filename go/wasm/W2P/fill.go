package main

import (
	"fmt"
	"image/color"
	"regexp"
	"strconv"
	"strings"
	"syscall/js"

	"github.com/transcriptaze/wav2png/wav2png"
)

func onFill(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		fillspec, settings := fill(inputs[1])

		options.fillspec = fillspec

		if err := redraw(); err != nil {
			callback.Invoke(err.Error())
		} else if err := save(TagFill, settings); err != nil {
			callback.Invoke(err.Error())
		} else {
			callback.Invoke(js.Null())
		}
	}()

	return nil
}

func fill(object js.Value) (wav2png.FillSpec, interface{}) {
	fillspec := wav2png.NewSolidFill(FILL_COLOUR)
	settings := fillSettings(object)

	clean := func(v js.Value) string {
		return strings.ReplaceAll(strings.ToLower(v.String()), " ", "")
	}

	if !object.IsNull() {
		fill := clean(object.Get("type"))
		colour := FILL_COLOUR

		if c := object.Get("colour"); !c.IsNull() && !c.IsUndefined() {
			s := clean(c)
			if regexp.MustCompile("#[[:xdigit:]]{8}").MatchString(s) {
				red := uint8(0)
				green := uint8(0x80)
				blue := uint8(0)
				alpha := uint8(0xff)

				if _, err := fmt.Sscanf(s, "#%02x%02x%02x%02x", &red, &green, &blue, &alpha); err == nil {
					colour = color.NRGBA{R: red, G: green, B: blue, A: alpha}
				}
			}
		}

		switch fill {
		case "solid":
			fillspec = wav2png.NewSolidFill(colour)

		default:
			fillspec = wav2png.NewSolidFill(colour)
		}
	}

	return fillspec, settings
}

func fillSettings(object js.Value) interface{} {
	settings := struct {
		Fill   string `json:"type"`
		Colour string `json:"colour"`
		Alpha  uint   `json:"alpha"`
	}{
		Fill:   "solid",
		Colour: "#000000",
		Alpha:  255,
	}

	clean := func(v js.Value) string {
		return strings.ReplaceAll(strings.ToLower(v.String()), " ", "")
	}

	if !object.IsNull() {
		fill := clean(object.Get("type"))

		if c := object.Get("colour"); !c.IsNull() && !c.IsUndefined() {
			if match := regexp.MustCompile("#([[:xdigit:]]{6})([[:xdigit:]]{2})").FindStringSubmatch(clean(c)); match != nil && len(match) == 3 {
				colour, _ := strconv.ParseInt(match[1], 16, 32)
				alpha, _ := strconv.ParseInt(match[2], 16, 16)

				settings.Colour = fmt.Sprintf("#%06x", colour)

				if alpha >= 0 && alpha < 256 {
					settings.Alpha = uint(alpha)
				}
			}
		}

		switch fill {
		case "solid":
			settings.Fill = "solid"

		default:
			settings.Fill = "solid"
		}
	}

	return settings
}
