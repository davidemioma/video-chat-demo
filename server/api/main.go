// Run go mod init <app name> to initialise app
// Run "echo 'export PATH=$PATH:$(go env GOPATH)/bin' >> ~/.zshrc", "source ~/.zshrc" and "air" to start server.
// If you need a port, install "go get github.com/lpernett/godotenv", run "go mod vendor" and run "go mod tidy".
// To run a server, install "go get github.com/go-chi/chi" and "go get github.com/go-chi/cors", run "go mod vendor" and run "go mod tidy"

package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/websocket"
	"github.com/lpernett/godotenv"

	_ "github.com/lib/pq"
)

func main () {
	godotenv.Load(".env")

	port := os.Getenv("PORT")

	if port == ""{
	    log.Fatal("PORT not found")
	}

	// Create a logger
	logger := log.New(os.Stdout, "INFO: ", log.Ldate|log.Ltime|log.Lshortfile)

	// setup Socket
	socket := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
	},}

	app := application{
		socket: socket,
		logger: logger,
	}

	app.allRooms.init()

	r := app.mount()

	log.Printf("Server running on port %v", port)

	log.Fatal(app.run("0.0.0.0:" + port, r))
}