import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  TextField,
  IconButton,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import KeyboardReturnTwoToneIcon from "@mui/icons-material/KeyboardReturnTwoTone";
import io from "socket.io-client";
import HomeIcon from "@mui/icons-material/Home";

function Room() {
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  const { roomCode } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isRoom, setIsRoom] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [selfSocketId, setSelfSocketId] = useState("");
  const [roomMessages, setRoomMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socket = io(`${process.env.REACT_APP_API_URL}`, {
      withCredentials: true,
    });
    setSocket(socket);

    const username = localStorage.getItem("username");
    if (!username) {
      navigate(`/login`);
    }
    socket.emit("joinRoom", {
      roomCode: roomCode,
    });

    socket.on("roomResponse", (data) => {
      setSelfSocketId(data.socketId);
      setIsRoom(data.roomStatus);
      setIsLoading(false);
    });

    socket.on("cookieResponse", (data) => {
      if (data === false) {
        navigate(`/login`);
      }
    });

    socket.on("chatMessage", (data) => {
      setRoomMessages((prevMessages) => prevMessages.concat(data));
    });

    return () => {
      socket.emit("leaveRoom");
      socket.off("roomResponse");
      socket.off("chatMessage");
      socket.close();
    };
  }, [setSocket]);

  const sendMessage = () => {
    socket.emit("roomMessage", { content: inputMessage });
    setInputMessage("");
  };

  const goHome = () => {
    navigate(`/`);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
    return () => {};
  }, [roomMessages]);

  return (
    <Box sx={{ height: "100vh", width: "100vw" }}>
      <Box>
        <AppBar position="static">
          <Toolbar
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box
              display={{ display: "flex", alignItems: "center" }}
              onClick={goHome}
            >
              <Box
                component="img"
                sx={{
                  height: 40,
                  width: 40,
                  cursor: "pointer",
                }}
                alt="tetchat logo"
                src={require("../data/tetchat-white.png")}
              />
              <Typography
                variant="h6"
                component="div"
                sx={{ cursor: "pointer", marginLeft: 1, fontFamily: "Poppins" }}
              >
                Tetchat
              </Typography>
            </Box>
            <Typography
              variant="subtitle1"
              component="div"
              sx={{ cursor: "pointer" }}
            >
              {roomCode}
            </Typography>
            <IconButton color="inherit" onClick={goHome}>
              <HomeIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      </Box>
      {isLoading ? (
        <Box
          sx={{
            height: "80%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : isRoom ? (
        <>
          <Box
            sx={{
              height: "90%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            <Box
              padding={2}
              margin={5}
              sx={{
                height: "100%",
                border: "solid 1px rgba(0, 0, 0, 0.37)",
                borderRadius: "4px",
                minWidth: 275,
                overflow: "scroll",
              }}
            >
              {roomMessages.map((obj, i) => {
                return (
                  <Box
                    sx={
                      obj.socketId === selfSocketId
                        ? {
                            width: "100%",
                            display: "flex",
                            justifyContent: "flex-end",
                          }
                        : { width: "100%" }
                    }
                    key={i}
                  >
                    <Card
                      sx={
                        obj.socketId === selfSocketId
                          ? {
                              minWidth: 275,
                              width: "50%",
                              marginBottom: 2,
                              backgroundColor: "rgb(0, 132, 255)",
                            }
                          : { minWidth: 275, width: "50%", marginBottom: 2 }
                      }
                    >
                      <CardContent>
                        <Typography sx={{ mb: 1 }} color="text.secondary">
                          {obj.username}
                        </Typography>
                        <Typography variant="body2">{obj.content}</Typography>
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
              <div ref={bottomRef} />
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TextField
                placeholder="Write here to chat."
                multiline
                rows={2}
                maxRows={4}
                onInput={(event) => {
                  setInputMessage(event.target.value);
                }}
                value={inputMessage}
              />
              <IconButton onClick={sendMessage}>
                <KeyboardReturnTwoToneIcon />
              </IconButton>
            </Box>
          </Box>
        </>
      ) : (
        <Box
          sx={{
            height: "80%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography variant="h3">{`No room at ${roomCode}`}</Typography>
        </Box>
      )}
    </Box>
  );
}

export default Room;
