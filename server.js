const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server, {
  pingTimeout: 600000,
  cors: {
    origin: "*",
  },
});


const PORT = process.env.PORT || 8005;
server.listen(PORT, () => {
  console.log("app running on port ::", PORT);
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

var active_rooms = {};

io.on("connection", (socket) => {
  console.log("socket connection made", socket.id)
  socket.on("create_room", (data) => {
    let { meeting_room } = data;
    active_rooms[meeting_room.room_id] = meeting_room;
    console.log("**** Meeting Created **** ",active_rooms);
  });

  socket.on("poll_meeting",(data) =>{
    let { meeting_id , connectionId } = data;
    console.log(connectionId)
    socket.emit("get_meeting_room",{
      room : active_rooms[meeting_id]
    });
    console.log(" **** Meeting info sent to client ***** ",active_rooms[meeting_id]);
  })

  socket.on("exit_user_from_room", (data) => {
    let { user, meeting_id } = data;
    let meeting = active_rooms[meeting_id];
    if (meeting && meeting.participants) {
      meeting.participants = meeting.participants.filter(
        (p) => p.id !== user.id
      );
      meeting.participants.forEach((c) => {
        console.log("connectionId is ::: "+c.connectionId);
        socket.to(c.connectionId).emit("notify_participants_about_exited_user", {
          meeting,
          exited_connection_id : socket.id,
          exited_user : user
        });
      });
      console.log(" **** User exited Meeting ***** ",active_rooms);
    }
  });

  socket.on("user_joined_meeting_room", (data) => {
    let { user, meeting_room } = data;
    user["connectionId"] = socket.id;
    console.log(user,"user");
    let meeting = active_rooms[meeting_room.room_id];
    if (meeting) {
      let userExists = meeting.participants.find(ex => ex.id === user.id);
      if(userExists) return;
      meeting.participants.push(user);

      socket.emit("sync_meeting_info",meeting);
      
      meeting.participants.forEach((c) => {
        if (c.connectionId !== socket.id) {
          console.log("connectionId is ::: " + c.connectionId);
          socket.to(c.connectionId).emit("notify_participants_about_joined_user", {
            meeting,
            new_connection_id: socket.id,
            joined_user: user,
          });
        }
      });
      console.log(" **** User joined Meeting ***** ",active_rooms);
    }
  });

  socket.on("send_offer",(data) => {
    console.log(" *** sending offer *** ");
    let { message, meeting_id , to} = data;
    socket.to(to).emit("receive_offer",{
      message,
      from : socket.id
    });
  });

  socket.on("send_answer",(data) => {
    console.log(" *** sending answer *** ");
    let { message, meeting_id , to} = data;
    socket.to(to).emit("receive_answer",{
      message,
      from : socket.id
    });
  });

  socket.on("on_new_ice_candidate",(data) => {
    console.log(" *** on ice candidate *** ", data);
    let { message, meeting_id , to} = data;
    let candidate = message;
    socket.to(to).emit("receive_ice_candidate",{
      candidate,
      from : socket.id
    });
  })

});
