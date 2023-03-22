require("dotenv").config();
const mysql = require("mysql2");
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const ioCookieParser = require("socket.io-cookie");
const originWebApp = process.env.APPURL || "http://localhost:3000";
const io = new Server(server, {
  cors: {
    origin: originWebApp,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
const cors = require("cors");
const crypto = require("crypto").webcrypto;
const cookieParser = require("cookie-parser");
const { check, validationResult } = require("express-validator");
const uuid = require("uuid");
const fs = require("fs");
const port = process.env.PORT || 5000;
const pool = mysql
  .createPool({
    host: process.env.BDD_HOST,
    port: process.env.BDD_PORT,
    user: process.env.BDD_USER,
    password: process.env.BDD_PASS,
    database: process.env.BDD_NAME,
  })
  .promise();

const rooms = []; //Contain all chat rooms available
const sessions = {}; //Contains all sessions for Cookies

class Session {
  constructor(username, expireDate) {
    this.username = username;
    this.expireDate = expireDate;
  }

  isExpired() {
    this.expireDate < new Date();
  }
}

/*
 * Express API config
 **/

app.use(
  cors({
    credentials: true,
    origin: originWebApp,
  })
);
app.use(express.json());
app.use(cookieParser());
app.enable("trust proxy");
app.use(express.urlencoded({ extended: false }));
io.use(ioCookieParser);

/*
 * Generation of Session ID with expiration date 5 hours from current date
 * Session is then created with Session class with previous informations
 * Session is then stored in sessions object and returned
 **/

const generateCookie = (username) => {
  const sessionToken = uuid.v4();
  const expirationDate = new Date(+new Date() + 1000 * 60 * 60 * 5);
  const session = new Session(username, expirationDate);
  sessions[sessionToken] = session;
  return { sessionToken: sessionToken, expirationDate };
};

const cookieVerification = (cookies) => {
  const sessionToken = cookies["sessionToken"];
  const session = sessions[sessionToken];

  if (cookies) {
    if (sessionToken) {
      if (session) {
        if (session.isExpired()) {
          return { isVerified: false, reason: "Session is expired" };
        } else {
          return { isVerified: true, reason: "Session is valid" };
        }
      } else {
        return { isVerified: false, reason: "No session assigned to token" };
      }
    } else {
      return { isVerified: false, reason: "Session token is missing" };
    }
  } else {
    return { isVerified: false, reason: "Cookies are missing" };
  }
};

app.get("/", (req, res) => {
  res.sendStatus(200);
});

/*
 * Creation of new room
 **/
app.post(
  "/newRoom",
  [check("roomName").not().isEmpty().withMessage("Room name is required")], //Validation parameters
  (req, res) => {
    const errors = validationResult(req); //Validation verification
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const roomName = req.body.roomName;
    const cookies = req.cookies;

    const { isVerified, reason } = cookieVerification(cookies);

    if (isVerified) {
      /*
       * Room code creation
       **/

      var array = new Uint32Array(6);
      crypto.getRandomValues(array);
      let roomCode = "";
      const digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      for (let i = 0; i < array.length; i++)
        roomCode += digits[array[i] % digits.length];

      const roomInfo = { name: roomName, code: roomCode, size: 0 };

      rooms.push(roomInfo);

      res.status(200).json(roomInfo);
    } else {
      res.status(401).json({ reason: reason });
    }
  }
);

/*
 * Get all available rooms
 **/
app.get("/getRooms", (req, res) => {
  const cookies = req.cookies;

  const { isVerified, reason } = cookieVerification(cookies);

  if (isVerified) {
    res.status(200).json(rooms);
  } else {
    res.status(401).json({ reason: reason });
  }
});

/*
 * Verify room cookie
 **/
app.get("/verifyCookie", (req, res) => {
  const cookies = req.cookies;

  const { isVerified, reason } = cookieVerification(cookies);

  if (isVerified) {
    res.sendStatus(200);
  } else {
    res.status(401).json({ reason: reason });
  }
});

/*
 * User authentification
 **/
app.post(
  "/logIn",
  [
    check("username").not().isEmpty().withMessage("Username is required"),
    check("password").not().isEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const username = req.body.username;
    const password = req.body.password;

    const [result] = await pool.query(
      `SELECT count(*) as userCount from user where username = ? and password = ?`,
      [username, password],
      function (error) {
        if (error) {
          res.status(500).json({ reason: error });
        }
      }
    );
    if (result[0].userCount === 0) {
      res.status(400).json({ reason: "Invalid credentials" });
      return;
    }
    const { sessionToken, expirationDate } = generateCookie(username);
    res.cookie("sessionToken", sessionToken, {
      // Sets a cookie on the client with the name "sessionToken" and the value the UUID generated
      expires: expirationDate, //Sets expiration time
      secure: true,
      sameSite: "none",
    });
    res.end();
  }
);

/*
 * User register
 **/
app.post(
  "/register",
  [
    check("username").not().isEmpty().withMessage("Username is required"),
    check("password")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      )
      .withMessage(
        "Password should have a minimum of eight characters, at least one uppercase letter, one lowercase letter, one number and one special character"
      ), //Password requirement
  ],
  async (req, res) => {
    const errors = validationResult(req); //Validation verification
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const username = req.body.username;
    const password = req.body.password;
    const [usernameCountResult] = await pool.query(
      `SELECT count(*) as userCount from user where username = ?`,
      [username, password],
      function (error) {
        if (error) {
          res.status(500).json({ reason: error });
        }
      }
    );
    if (usernameCountResult[0].userCount !== 0) {
      res.status(400).json({ reason: "Username already used" });
      return;
    }
    const [creationResult] = await pool.query(
      `insert into user (username, password) value (?, ?)`,
      [username, password],
      function (error) {
        if (error) {
          res.status(500).json({ reason: error });
          return;
        }
      }
    );
    if (creationResult.affectedRows !== 1) {
      res.status(500).json({ reason: "No rows affected" });
      return;
    }
    res.sendStatus(201);
  }
);

/*
 * User disconnection
 **/
app.post("/logOut", (req, res) => {
  const cookies = req.cookies;
  if (cookies) {
    const sessionToken = cookies["sessionToken"];
    if (sessionToken) {
      delete sessions[sessionToken];
      res.cookie("sessionToken", "", { expires: new Date() });
      res.end();
    } else {
      res.status(401).json({ reason: "Session token is missing" });
      return;
    }
  } else {
    res.status(400).json({ reason: "User is missing cookies" });
    return;
  }
});

/*
 * Socket.io
 **/
io.on("connection", (socket) => {
  const leaveRoom = (data) => {
    const currentRoom = rooms.find(({ code }) => code === roomCode);

    if (rooms.length !== 0 && roomCode !== "" && currentRoom) {
      socket.leave(roomCode); //Leave socket room
      currentRoom.size += -1;
      const size = currentRoom.size;
      if (size === 0) {
        const indexCurrentRoom = rooms.indexOf(currentRoom); //Room deletion if empty
        rooms.splice(indexCurrentRoom, 1);
      }
      roomCode = "";
    }
  };

  let roomCode = "";
  let username;

  socket.on("joinRoom", (data) => {
    const cookie = socket.request.headers.cookie;
    if (!cookie) {
      socket.emit("cookieResponse", false);
      return;
    }
    const { isVerified, reason } = cookieVerification(cookie);
    if (!isVerified) {
      socket.emit("cookieResponse", false);
      return;
    }
    socket.emit("cookieResponse", true);
    roomCode = data.roomCode;
    username = sessions[cookie.sessionToken].username;
    const codes = rooms.map(({ code }) => code);
    if (codes.includes(roomCode)) {
      //Verify room existence
      const response = { socketId: socket.id, roomStatus: true };
      socket.emit("roomResponse", response);
      socket.join(roomCode);

      rooms.find(({ code }) => code === roomCode).size += 1;
    } else {
      const response = { socketId: socket.id, roomStatus: false };
      socket.emit("roomResponse", response);
    }
  });

  socket.on("roomMessage", (data) => {
    const cookie = socket.request.headers.cookie;
    const { isVerified, reason } = cookieVerification(cookie);
    if (!isVerified) {
      socket.emit("cookieResponse", false);
      return;
    }
    socket.emit("cookieResponse", true);
    const content = data.content;
    const messageObj = {
      socketId: socket.id,
      username: username,
      content: content,
    };
    io.in(roomCode).emit("chatMessage", messageObj); //Emit a message in current room
  });

  socket.on("leaveRoom", () => {
    leaveRoom();
  });

  socket.on("disconnect", () => {
    //Leave room on disconnect
    leaveRoom();
  });
});

server.listen(port, () => {
  console.log(`App is runnning on port ${port}`);
});
