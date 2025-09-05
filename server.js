
const http = require("http");
const server = http.createServer();
const validOrigins = ["https://launch.playcanvas.com", "https://playcanv.as"];
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

let countPlayers = 0;
const maxPlayers = 2;

const io = require("socket.io")(server, {
  cors: {
    origin: validOrigins,
    methods: ["GET", "POST"],
  },
});

const players = {};

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
  socket.on("initialize", () => {
    if (countPlayers >= maxPlayers) {
      socket.emit("roomFull", { message: "Room is full. Try again later." });
      return;
    }
    countPlayers++;
    const id = socket.id;
    const newPlayer = new Player(id);
    players[id] = newPlayer;

    socket.emit("playerData", {
      id,
      players,
      countPlayers,
    });
    socket.broadcast.emit("playerJoined", {
      newPlayer,
      countPlayers,
    });
  });

  socket.on("positionUpdate", (data) => {
    const player = players[socket.id];
    if (!player) return;
    player.x = data.x;
    player.y = data.y;
    player.z = data.z;
    player.rx = data.rx;
    player.ry = data.ry;
    player.rz = data.rz;
    socket.broadcast.emit("playerMoved", { ...data, id: socket.id });
  });

  socket.on("disconnect", () => {
    if (!players[socket.id]) return;
    delete players[socket.id];
    countPlayers--;
    socket.broadcast.emit("killPlayer", {
      sid: socket.id,
      countPlayers,
    });
  });
});

console.log(`Server started. Listening on ${HOST}:${PORT}`);
server.listen(PORT, HOST);
