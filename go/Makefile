all: test      \
	 benchmark \
     coverage

clean:
	go clean

format: 
	gofmt -l -w .

debug: build
	go test ./... 

build: format
	GOOS=js GOARCH=wasm go build -o ../wasm/ ./...
	mv ../wasm/T2B ../wasm/T2B.wasm
	mv ../wasm/W2P ../wasm/W2P.wasm

build-all: format
	GOOS=js GOARCH=wasm go build -o ../wasm/ ./...
	mv ../wasm/T2B ../wasm/T2B.wasm
	mv ../wasm/W2P ../wasm/W2P.wasm

vet: build
	go vet ./...

lint: build
	golint ./...

run: build
	mkdir -p bin
	go run ./httpd/httpd.go	

buildx:
	find . -name "*.go" | entr make build
