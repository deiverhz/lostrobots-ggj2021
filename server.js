var server = require("http").createServer();
const validOrigins = ["https://launch.playcanvas.com", "https://playcanv.as"];
const PORT = process.env.PORT || 3000; // Default to 3000 if env var not set
const HOST = process.env.HOST || '0.0.0.0'; // Default to 0.0.0.0

var countPlayers = 0;
var maxPlayers = 2;

const io = require("socket.io")(server, {
  cors: {
    origin: validOrigins,
    methods: ["GET", "POST"],
  },
});

var players = {};

function Player(id) {
  this.id = id;
  this.x = 0;
  this.y = 0;
  this.z = 0;
  this.rx = 0;
  this.ry = 0;
  this.rz = 0;
  this.entity = null;
}

io.on("connection", (socket) => {
  socket.on("initialize", function () {
    if (countPlayers >= maxPlayers) {
      socket.emit("roomFull", { message: "Room is full. Try again later." });
      return;
    }
    countPlayers++;
    var id = socket.id;
    var newPlayer = new Player(id);
    players[id] = newPlayer;

    socket.emit("playerData", {
      id: id,
      players: players,
      countPlayers: countPlayers,
    });
    socket.broadcast.emit("playerJoined", {
      newPlayer: newPlayer,
      countPlayers: countPlayers,
    });
  });

  socket.on("positionUpdate", function (data) {
    if (!players[data.id]) return;
    players[data.id].x = data.x;
    players[data.id].y = data.y;
    players[data.id].z = data.z;
    players[data.id].rx = data.rx;
    players[data.id].ry = data.ry;
    players[data.id].rz = data.rz;

    socket.broadcast.emit("playerMoved", data);
  });

  socket.on("disconnect", function () {
    if (!players[socket.id]) return;
    delete players[socket.id];
    // Update clients with the new player killed
    countPlayers--;
    socket.broadcast.emit("killPlayer", {
      sid: socket.id,
      countPlayers: countPlayers,
    });
  });
});

console.log("Server started.");
server.listen(PORT, HOST);
console.log(`Listening on ${HOST}:${PORT}`);
