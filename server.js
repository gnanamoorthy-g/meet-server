const express = require('express');
const app = express();
const server = require("http").Server(app);
const io = require('socket.io')(server);
const path = require('path');


server.listen(8001, () => {
    console.log("app running on port 8000")
});

var connections = [];

io.on("connection", (socket) => {

    console.log("socket connection made", socket.id);
    socket.on('user_joined_meeting_room', (data) => {
        let { user, meeting } = data;
        connections.push({
            connectionId: socket.id,
            user,
            meeting,
            meetingId: meeting.room_id
        });
        console.log(connections, "connections");

        connections.forEach(c => {
            socket.to(c.connectionId).emit("notify_participants", {
                meeting_room: c.meetingId,
                activeConnections: connections
            });
        });
    });
})