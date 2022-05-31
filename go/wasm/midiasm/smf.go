package main

import (
	"encoding/json"
	"fmt"
)

type SMF struct {
	MThd *MThd `json:"MThd,omitempty"`
}

type MThd struct {
	Bytes  Hex    `json:"bytes"`
	Detail string `json:"detail"`
}

type Hex []byte

func (bytes Hex) MarshalJSON() ([]byte, error) {
	hex := ""
	for _, b := range bytes {
		hex += fmt.Sprintf("%02X ", b)
	}

	return json.Marshal(hex)
}
