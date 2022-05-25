all: test      \
     benchmark \
     coverage

.PHONY: build
.PHONY: build-all

build: 
	npx eslint --fix ./javascript/*.js

build-all: build
	cd go; gofmt -l -w .
	cd go; GOOS=js GOARCH=wasm go build -o ../wasm/ ./...
	mv ./wasm/T2B     ./wasm/T2B.wasm
	mv ./wasm/W2P     ./wasm/W2P.wasm
	mv ./wasm/midiasm ./wasm/midiasm.wasm

test: build-all
	npm test
	
run: build-all
	cd go; mkdir -p bin; go run ./httpd/httpd.go	



