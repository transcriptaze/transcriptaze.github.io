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

var GRID_COLOUR = DARKGREEN

const GRID_SIZE = 64
const GRID_WIDTH = 64
const GRID_HEIGHT = 48
const GRID_FIT = wav2png.Approximate
const GRID_OVERLAY = false

func onGrid(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		options.gridspec = grid(inputs[1])

		if err := redraw(); err != nil {
			callback.Invoke(err.Error())
		} else {
			callback.Invoke(js.Null())
		}
	}()

	return nil
}

func grid(object js.Value) wav2png.GridSpec {
	if !object.IsNull() {
		grid := object.Get("type").String()
		colour := GRID_COLOUR
		size := GRID_SIZE
		width := GRID_WIDTH
		height := GRID_HEIGHT
		fit := GRID_FIT
		overlay := GRID_OVERLAY

		if c := object.Get("colour"); !c.IsNull() && !c.IsUndefined() {
			s := strings.ToLower(c.String())
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

		if sz := object.Get("size"); !sz.IsNull() && !sz.IsUndefined() {
			if matched := regexp.MustCompile(`([~=><≥≤]).*`).FindStringSubmatch(sz.String()); matched != nil && len(matched) == 2 {
				switch matched[1] {
				case "~":
					fit = wav2png.Approximate
				case "=":
					fit = wav2png.Exact
				case ">":
					fit = wav2png.AtLeast
					size += 1
				case "<":
					fit = wav2png.AtMost
					size -= 1
				case "≥":
					fit = wav2png.AtLeast
				case "≤":
					fit = wav2png.AtMost
				}
			}

			if matched := regexp.MustCompile(`([~=><≥≤])?\s*([0-9]+)`).FindStringSubmatch(sz.String()); matched != nil && len(matched) == 3 {
				if v, err := strconv.ParseInt(matched[2], 10, 32); err == nil && v >= 16 && v <= 1024 {
					size = int(v)
				}
			}

			if matched := regexp.MustCompile(`([~=><≥≤])?\s*([0-9]+)x([0-9]+)`).FindStringSubmatch(sz.String()); matched != nil && len(matched) == 4 {
				if v, err := strconv.ParseInt(matched[2], 10, 32); err == nil && v >= 16 && v <= 1024 {
					width = int(v)
				}

				if v, err := strconv.ParseInt(matched[3], 10, 32); err == nil && v >= 16 && v <= 1024 {
					height = int(v)
				}
			}
		}

		if o := object.Get("overlay"); !o.IsNull() && !o.IsUndefined() {
			overlay = o.Bool()
		}

		switch grid {
		case "none":
			return wav2png.NewNoGrid()

		case "square":
			return wav2png.NewSquareGrid(colour, uint(size), fit, overlay)

		case "rectangular":
			return wav2png.NewRectangularGrid(colour, uint(width), uint(height), fit, overlay)
		}
	}

	return wav2png.NewSquareGrid(GRID_COLOUR, GRID_SIZE, GRID_FIT, GRID_OVERLAY)
}
