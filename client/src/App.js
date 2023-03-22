import React from "react";
import { Route, Routes } from "react-router-dom";
import Acceuil from "./component/Acceuil";
import Room from "./component/Room";
import Login from "./component/Login";
import Register from "./component/Register";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Acceuil />} />
      <Route path="/room/:roomCode" element={<Room />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default App;
