// Run go mod init <app name> to initialise app
// Run "echo 'export PATH=$PATH:$(go env GOPATH)/bin' >> ~/.zshrc", "source ~/.zshrc" and "air" to start server.
// If you need a port, install "go get github.com/lpernett/godotenv", run "go mod vendor" and run "go mod tidy".
// To run a server, install "go get github.com/go-chi/chi" and "go get github.com/go-chi/cors", run "go mod vendor" and run "go mod tidy"

package main

import (
	"log"
	"os"

	"github.com/lpernett/godotenv"
)

func main () {
	godotenv.Load(".env")

	port := os.Getenv("PORT")

	if port == ""{
	    log.Fatal("PORT not found")
	}

	app := application{}

	app.allRooms.init()

	r := app.mount()

	log.Printf("Server running on port %v", port)

	log.Fatal(app.run("0.0.0.0:" + port, r))
}