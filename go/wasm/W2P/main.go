// +build js,wasm

// WASM interface for the taps2beats functions
package main

import (
    "bytes"
    "encoding/binary"
    "fmt"
    "syscall/js"

        "image"
    "image/color"
    // "image/draw"
    // "image/png"
)

const VERSION = "v0.1.0"

func main() {
    c := make(chan bool)

    js.Global().Set("goRender", js.FuncOf(render))

    <-c
}

func render(this js.Value, inputs []js.Value) interface{} {
    callback := inputs[0]
    buffer := inputs[1]
    canvas := inputs[2]

    go func() {
        sampleRate := buffer.Get("sampleRate").Float()
        length := buffer.Get("length").Int()
        duration := buffer.Get("duration").Float()
        channels := buffer.Get("numberOfChannels").Int()
        data := buffer.Call("getChannelData",0)
        samples := float32ArrayToSlice(data)

        fmt.Printf(" sample rate: %v\n", sampleRate)
        fmt.Printf(" length:      %v\n", length)
        fmt.Printf(" duration:    %v\n", duration)
        fmt.Printf(" channels:    %v\n", channels)
        fmt.Printf(" samples:     %v\n", len(samples))
        fmt.Printf(" canvas:      %v\n", canvas)

        if png := grid(640,390,0); png != nil {
            pngToCanvas(canvas, png)
        }

        callback.Invoke(js.Null(), js.Null())
    }()

    return nil
}

func float32ArrayToSlice(array js.Value) []float32 {
    u8array := js.Global().Get("Uint8Array").New(array)
    N := u8array.Length()
    buffer := make([]byte, N)
    floats := make([]float32, N/4)

    js.CopyBytesToGo(buffer, u8array)
    binary.Read(bytes.NewReader(buffer), binary.LittleEndian, floats)

    return floats
}

func pngToCanvas(canvas js.Value, img *image.NRGBA) {
    bounds := img.Bounds()
    w := bounds.Max.X - bounds.Min.X
    h := bounds.Max.Y - bounds.Min.Y

    u8array := js.Global().Get("Uint8Array").New(len(img.Pix))
    context := canvas.Call("getContext", "2d")
    data := context.Call("createImageData", w, h)
    js.CopyBytesToJS(u8array, img.Pix)
    data.Get("data").Call("set", u8array)
    context.Call("putImageData", data, 0, 0, 0, 0, w, h)
}

func grid(width, height, padding uint) *image.NRGBA {
    w := width + 2*padding
    h := height + 2*padding
    img := image.NewNRGBA(image.Rect(0, 0, int(w), int(h)))

    for y := uint(0); y < h; y++ {
        for x := uint(0); x < w; x++ {
            img.Set(int(x), int(y), color.NRGBA{R: 0x22, G: 0x22, B: 0x22, A: 255})
        }
    }

    for _, y := range []uint{1, 63, 127, 128, 191, 254} {
        for x := uint(0); x < width; x++ {
            img.Set(int(x+padding), int(y+padding), color.NRGBA{R: 0x00, G: 0x80, B: 0x00, A: 255})
        }
    }

    for x := uint(0); x <= width; x += 64 {
        for y := uint(1); y < height-1; y++ {
            img.Set(int(x+padding), int(y+padding), color.NRGBA{R: 0x00, G: 0x80, B: 0x00, A: 255})
        }
    }

    return img
}
