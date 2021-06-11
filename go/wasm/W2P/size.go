// +build js,wasm

package main

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"syscall/js"
)

type Size struct {
	width  int
	height int
}

func onSize(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		options.Size.parse(inputs[1], inputs[2])

		if err := redraw(); err != nil {
			callback.Invoke(err.Error())
		} else if err := options.Size.save(TagSize); err != nil {
			callback.Invoke(err.Error())
		} else {
			callback.Invoke(js.Null())
		}
	}()

	return nil
}

func onCustomSize(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]

	go func() {
		options.CustomSize.parse(inputs[1], inputs[2])

		if err := redraw(); err != nil {
			callback.Invoke(err.Error())
		} else if err := options.CustomSize.save(TagCustomSize); err != nil {
			callback.Invoke(err.Error())
		} else {
			callback.Invoke(js.Null())
		}
	}()

	return nil
}

func (s *Size) parse(width, height js.Value) {
	if !width.IsNull() && !width.IsNaN() {
		if v := width.Int(); v > 32 && v <= 8192 {
			s.width = v
		}
	}

	if !height.IsNull() && !height.IsNaN() {
		if v := height.Int(); v > 32 && v <= 8192 {
			s.height = v
		}
	}
}

func (s Size) save(tag Tag) error {
	v := fmt.Sprintf("%dx%d", s.width, s.height)

	return save(tag, v)
}

func (s *Size) restore(tag Tag) error {
	size := ""

	if err := restore(tag, &size); err != nil {
		return err
	}

	match := regexp.MustCompile("^([0-9]+)x([0-9]+)$").FindStringSubmatch(size)
	if match == nil || len(match) != 3 {
		return fmt.Errorf("Invalid stored size (%v)", size)
	}

	w, err := strconv.Atoi(match[1])
	if err != nil {
		return err
	}

	h, err := strconv.Atoi(match[2])
	if err != nil {
		return err
	}

	if w > 32 && w <= 8192 {
		s.width = w
	}

	if h > 32 && h <= 8192 {
		s.height = h
	}

	return nil
}

func (s Size) MarshalJSON() ([]byte, error) {
	return json.Marshal(fmt.Sprintf("%dx%d", s.width, s.height))
}
