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
			if(participant.Conn != nil && participant.Conn != msg.Client){
				app.allRooms.Mutex.Lock()

				err := participant.Conn.WriteJSON(msg.Message)

				app.allRooms.Mutex.Unlock()

				if err != nil{
					app.logger.Println("Channel Error: ", err)

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

	app.logger.Println("Web Socket Connection: ", ws.RemoteAddr())

	if wsErr != nil {
		errMsg := "Web socket upgrade error"

		app.logger.Println("Socket Error", errMsg)

		respondWithError(w, http.StatusBadRequest, errMsg)
        
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
			app.logger.Println("Read Error: ", err)

			break
		}

		msg.Client = ws

		msg.RoomID = roomId

		app.logger.Println("Message: ", msg.Message)

		broadcastChannel <- msg
	}

	// Clean up when the connection is closed
	app.allRooms.deleteRoom(roomId)

	ws.Close() 
}