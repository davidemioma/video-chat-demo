package main

import (
	"log"
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Participant struct{
	Host bool
	Conn *websocket.Conn
}

type RoomMap struct {
	Mutex sync.RWMutex
	Map map[string][]Participant
}

// Initialise RoomMap
func (rm *RoomMap) init() {
	rm.Map = make(map[string][]Participant)
}

// Get room with participant based on room Id.
func (rm *RoomMap) getRoom(roomId string) []Participant {
	rm.Mutex.Lock()

	defer rm.Mutex.Unlock()

	return rm.Map[roomId]
}

// Create a unique room Id and insert it to RoomMap.
func (rm *RoomMap) createRoom() string {
	rm.Mutex.Lock()

	defer rm.Mutex.Unlock()

	roomId := uuid.New().String()

	rm.Map[roomId] = []Participant{}

	return roomId
}

// Add participant into a room
func (rm *RoomMap) insertIntoRoom(roomId string, participant Participant) {
	rm.Mutex.Lock()

	defer rm.Mutex.Unlock()

	log.Println("Inserting into room with ID: ", roomId)

	rm.Map[roomId] = append(rm.Map[roomId], participant)
}

// Delete a room and it's participants
func (rm *RoomMap) deleteRoom(roomId string) {
	rm.Mutex.Lock()

	defer rm.Mutex.Unlock()

	delete(rm.Map, roomId)
}