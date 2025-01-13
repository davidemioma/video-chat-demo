package main

import "net/http"

// Create a room and return room Id.
func (app *application) createRoomRequestHandler(w http.ResponseWriter, r *http.Request) {
	type Resp struct {
		RoomID  string `json:"roomId"`
		Message string `json:"message"`
	}

	roomId := app.allRooms.createRoom()

	app.logger.Println("New room created")

	respondWithJSON(w, http.StatusOK, Resp{
		RoomID: roomId,
		Message: "New room created",
	})
}

// Join room by room ID.
func (app *application) joinRoomRequestHandler(w http.ResponseWriter, r *http.Request) {
	respondWithJSON(w, http.StatusOK, "joinRoomRequestHandler")
}