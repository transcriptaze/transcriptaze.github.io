all: test      \
     benchmark \
     coverage

.PHONY: build
.PHONY: build-all

build: 
	npx eslint --fix ./javascript/*.js

build-all: build
	cd go; GOOS=js GOARCH=wasm go build -o ../wasm/transcriptaze.wasm ./...

test: build-all
	npm test
	
run: build-all
	cd go; mkdir -p bin; go run ./httpd/httpd.go	



