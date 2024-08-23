const express = require('express');
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});



server.listen(process.env.PORT, () => {
    console.log("app running on port ::",process.env.PORT);
});

app.use(function (req, res, next) {
  //Enabling CORS
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type,Accept, x-client-key, x-client-token, x-client-secret, Authorization"
  );
  next();
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