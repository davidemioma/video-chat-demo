package main

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

// Create a room and return room Id.
func (app *application) createRoomRequestHandler(w http.ResponseWriter, r *http.Request) {
	type Resp struct {
		RoomID  string `json:"roomId"`
		Message string `json:"message"`
	}

	roomId := app.allRooms.createRoom()

	app.logger.Println("New room created")

	respondWithJSON(w, http.StatusCreated, Resp{
		RoomID: roomId,
		Message: "New room created",
	})
}

// Setup Channel
var	broadcastChannel = make(chan BroadcastMsg)

// Read message from channel and send to all participant in a room except yourself.
func (app *application) broadcaster() {
	for {
		msg := <- broadcastChannel

		for _, participant := range(app.allRooms.Map[msg.RoomID]){
			if(participant.Conn != msg.Client){
				err := participant.Conn.WriteJSON(msg.Message)

				if err != nil{
					app.logger.Fatal(err)

					participant.Conn.Close()
				}
			}
		}
	}
}

// Join room by room ID.
func (app *application) joinRoomRequestHandler(w http.ResponseWriter, r *http.Request) {
	// Get the room Id from the URL params
    roomId := chi.URLParam(r, "roomId")

	if roomId == "" {
		respondWithError(w, http.StatusBadRequest, "Room ID is required")
        
        return
    }

	ws, wsErr := app.socket.Upgrade(w, r, nil)

	if wsErr != nil {
		msg := "Web socket upgrade error"

		app.logger.Println(msg)

		respondWithError(w, http.StatusBadRequest, msg)
        
        return
    }

	app.allRooms.insertIntoRoom(roomId, Participant{
		Host: false,
		Conn: ws,
	})

	go app.broadcaster()

	// Always Send messages to a room if a new user joined
	for {
		var msg BroadcastMsg

		err := ws.ReadJSON(&msg.Message)

		if err != nil{
			app.logger.Fatal("Read Error: ", err)
		}

		msg.Client = ws

		msg.RoomID = roomId

		app.logger.Println("Client Response: ", msg.Message)

		broadcastChannel <- msg
	}
}