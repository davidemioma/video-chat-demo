package main

import "github.com/gorilla/websocket"

type BroadcastMsg struct {
	RoomID  string
	Client  *websocket.Conn
	Message map[string]interface{}
}