all: test      \
	 benchmark \
     coverage

clean:
	go clean

format: 
	go fmt ./...

debug: build
	go test ./... 

build: format
	GOOS=js GOARCH=wasm go build -o ../wasm/transcriptaze.wasm ./...

build-all: format
	GOOS=js GOARCH=wasm go build -o ../wasm/transcriptaze.wasm ./...

vet: build
	go vet ./...

lint: build
	golint ./...

run: build
	mkdir -p bin
	go run ./httpd/httpd.go	

