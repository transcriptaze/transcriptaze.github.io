package main

import (
	"fmt"
	"image/color"
	"regexp"
	"strconv"
	"syscall/js"

	"github.com/transcriptaze/wav2png/wav2png"
)

type Grid struct {
	Grid    string `json:"grid"`
	Colour  string `json:"colour"`
	Alpha   uint8  `json:"alpha"`
	Size    string `json:"size"`
	WH      string `json:"wh"`
	Overlay bool   `json:"overlay"`
}

func onGrid(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		options.Grid.parse(inputs[1])

		if err := redraw(); err != nil {
			callback.Invoke(err.Error())
		} else if err := options.Grid.save(); err != nil {
			callback.Invoke(err.Error())
		} else {
			callback.Invoke(js.Null())
		}
	}()

	return nil
}

func (g *Grid) parse(object js.Value) {
	// ... grid type
	switch clean(object.Get("type")) {
	case "none":
		g.Grid = "none"

	case "square":
		g.Grid = "square"

	case "rectangular":
		g.Grid = "rectangular"
	}

	// ... grid overlay
	g.Overlay = object.Get("overlay").Bool()

	// ... grid colour
	g.Colour = object.Get("colour").String()

	// ... grid alpha
	g.Alpha = uint8(object.Get("alpha").Int())

	// ... square grid size
	{
		sz := object.Get("size")
		fit := wav2png.Approximate
		size := uint(64)

		if matched := regexp.MustCompile(`([~=><≥≤])?\s*([0-9]+)`).FindStringSubmatch(clean(sz)); matched != nil && len(matched) == 3 {
			switch matched[1] {
			case "~":
				fit = wav2png.Approximate
			case "=":
				fit = wav2png.Exact
			case "≥":
				fit = wav2png.AtLeast
			case "≤":
				fit = wav2png.AtMost
			case ">":
				fit = wav2png.LargerThan
			case "<":
				fit = wav2png.SmallerThan
			}

			if v, err := strconv.ParseUint(matched[2], 10, 32); err == nil && v >= 16 && v <= 1024 {
				size = uint(v)
			}
		}

		g.Size = fmt.Sprintf("%v%v", fit, size)
	}

	// ... rectangular grid size
	{
		sz := object.Get("wh")
		fit := wav2png.Approximate
		width := uint(64)
		height := uint(48)

		if matched := regexp.MustCompile(`([~=><≥≤])?\s*([0-9]+)x([0-9]+)`).FindStringSubmatch(clean(sz)); matched != nil && len(matched) == 4 {
			switch matched[1] {
			case "~":
				fit = wav2png.Approximate
			case "=":
				fit = wav2png.Exact
			case "≥":
				fit = wav2png.AtLeast
			case "≤":
				fit = wav2png.AtMost
			case ">":
				fit = wav2png.LargerThan
			case "<":
				fit = wav2png.SmallerThan
			}

			if v, err := strconv.ParseUint(matched[2], 10, 32); err == nil && v >= 16 && v <= 1024 {
				width = uint(v)
			}

			if v, err := strconv.ParseUint(matched[3], 10, 32); err == nil && v >= 16 && v <= 1024 {
				height = uint(v)
			}
		}

		g.WH = fmt.Sprintf("%v%vx%v", fit, width, height)
	}
}

func (g *Grid) save() error {
	return save(TagGrid, g)
}

func (g *Grid) restore() error {
	grid := options.Grid

	if err := restore(TagGrid, &grid); err != nil {
		return err
	}

	*g = grid

	return nil
}

func (g *Grid) gridspec() wav2png.GridSpec {
	// ... overlay
	overlay := g.Overlay

	// ... colour
	red := uint8(0)
	green := uint8(128)
	blue := uint8(0)
	alpha := g.Alpha

	colour := color.NRGBA{R: red, G: green, B: blue, A: alpha}

	if _, err := fmt.Sscanf(g.Colour, "#%02x%02x%02x", &red, &green, &blue); err == nil {
		colour = color.NRGBA{R: red, G: green, B: blue, A: g.Alpha}
	}

	// ... no grid
	if g.Grid == "none" {
		return wav2png.NewNoGrid()
	}

	// ... rectangular
	if g.Grid == "rectangular" {
		fit := wav2png.Approximate
		width := uint(64)
		height := uint(48)

		if matched := regexp.MustCompile(`([~=><≥≤])?\s*([0-9]+)x([0-9]+)`).FindStringSubmatch(g.WH); matched != nil && len(matched) == 4 {
			switch matched[1] {
			case "~":
				fit = wav2png.Approximate
			case "=":
				fit = wav2png.Exact
			case "≥":
				fit = wav2png.AtLeast
			case "≤":
				fit = wav2png.AtMost
			case ">":
				fit = wav2png.LargerThan
			case "<":
				fit = wav2png.SmallerThan
			}

			if v, err := strconv.ParseUint(matched[2], 10, 32); err == nil && v >= 16 && v <= 1024 {
				width = uint(v)
			}

			if v, err := strconv.ParseUint(matched[3], 10, 32); err == nil && v >= 16 && v <= 1024 {
				height = uint(v)
			}
		}

		return wav2png.NewRectangularGrid(colour, width, height, fit, overlay)
	}

	// ... default to square
	fit := wav2png.Approximate
	size := uint(64)

	if matched := regexp.MustCompile(`([~=><≥≤])?\s*([0-9]+)`).FindStringSubmatch(g.Size); matched != nil && len(matched) == 3 {
		switch matched[1] {
		case "~":
			fit = wav2png.Approximate
		case "=":
			fit = wav2png.Exact
		case "≥":
			fit = wav2png.AtLeast
		case "≤":
			fit = wav2png.AtMost
		case ">":
			fit = wav2png.LargerThan
		case "<":
			fit = wav2png.SmallerThan
		}

		if v, err := strconv.ParseUint(matched[2], 10, 32); err == nil && v >= 16 && v <= 1024 {
			size = uint(v)
		}
	}

	return wav2png.NewSquareGrid(colour, size, fit, overlay)
}
