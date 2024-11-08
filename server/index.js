const { Server } = require("socket.io");

const io = new Server(8000, {
  cors: true,
});


const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

//Establish the connection
io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);

  socket.on("chat", (message)=>{
    io.emit("message", message);
  });

  //Taking info of user and include in our map 
  socket.on("room:join", (data) => {
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    
    io.to(room).emit("user:joined", { email, id: socket.id });
    socket.join(room);
    io.to(socket.id).emit("room:join", data);
  });

  //Call the user and create offer
  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  //call are accepted
  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });
  
  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

});

