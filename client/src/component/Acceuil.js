import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Box, Typography, TextField, Button, Grid, Card, CardContent } from '@mui/material'

function Acceuil() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()
  const handleRegister = (data) => setRoom(data)
  const handleError = (errors) => {}
  const registerOptions = {
    roomName: { required: 'Room name is required' },
  }

  const [roomsAvailable, setRoomsAvailable] = useState([])
  const username = localStorage.getItem('username')

  const setRoom = (data) => {
    const roomName = data.roomName

    axios
      .post(`${process.env.REACT_APP_API_URL}/newRoom`, { roomName: roomName }, { withCredentials: true })
      .then((res) => {
        switch (res.status) {
          case 200:
            navigate(`/room/${res.data.code}`)
            break
          default:
            console.log(`Unknown error ${res.status}`)
        }
      })
      .catch((err) => {
        const { data, status } = err.response
        switch (status) {
          case 401:
            console.log(`${status}, ${data.reason}`)
            localStorage.setItem('username', '')
            navigate(`/login`)
            break
          default:
            console.log(`Unknown error ${status}`)
            localStorage.setItem('username', '')
            navigate(`/login`)
        }
      })
  }

  const getRooms = () => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/getRooms`, {
        withCredentials: true,
      })
      .then((res) => {
        switch (res.status) {
          case 200:
            setRoomsAvailable(res.data)
            break
          default:
            console.log(`Unknown error ${res.status}`)
        }
      })
      .catch((err) => {
        const { data, status } = err.response
        switch (status) {
          case 401:
            console.log(`${status}, ${data.reason}`)
            localStorage.setItem('username', '')
            navigate(`/login`)
            break
          default:
            console.log(`Unknown error ${status}`)
            localStorage.setItem('username', '')
            navigate(`/login`)
        }
      })
  }

  const disconnect = () => {
    axios
      .post(`${process.env.REACT_APP_API_URL}/logOut`, {}, { withCredentials: true })
      .then((res) => {
        switch (res.status) {
          case 200:
            console.log(`User disconnected ${res.status}`)
            localStorage.setItem('username', '')
            navigate(`/login`)
            break
          case 401:
            console.log(`Disconnection error ${res.status}`)
            break
          default:
            console.log(`Unknown error ${res.status}`)
        }
      })
      .catch((err) => {
        console.error(err)
      })
  }

  useEffect(() => {
    if (!username) {
      navigate(`/login`)
    }

    const getRoomsInterval = setInterval(() => {
      getRooms()
    }, 30000)

    getRooms()

    return clearTimeout(getRoomsInterval)
  }, [])

  return (
    <>
      <Box margin={2} sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography>{`${username}`}</Typography>
        <Button variant="outlined" onClick={disconnect}>
          Disconnect
        </Button>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            component="img"
            sx={{
              height: 100,
              width: 100,
            }}
            alt="tetchat logo"
            src={require('../data/tetchat.png')}
          />
          <Typography variant="h2" sx={{ fontFamily: 'Poppins' }}>
            Tetchat
          </Typography>
        </Box>

        <Box>
          <TextField
            autoComplete="off"
            label="Room name"
            variant="outlined"
            sx={{ width: '100%' }}
            {...register('roomName', registerOptions.roomName)}
            error={errors?.roomName ? true : false}
            helperText={errors?.roomName && errors.roomName?.message}
          />
          <Button
            variant="contained"
            sx={{ width: '100%', marginTop: '10px' }}
            onClick={handleSubmit(handleRegister, handleError)}
          >
            Create room
          </Button>
        </Box>
      </Box>
      <Box padding={5}>
        <Grid container spacing={3} alignItems="stretch">
          {roomsAvailable.map((room) => {
            return (
              <Grid
                item
                xs={12}
                sm={4}
                onClick={() => {
                  navigate(`/room/${room.code}`)
                }}
                key={room.code}
                sx={{ cursor: 'pointer' }}
              >
                <Card>
                  <CardContent sx={{ display: 'flex' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '75%',
                      }}
                    >
                      <Typography variant="h5" component="div">
                        {room.name}
                      </Typography>
                      <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                        {`Size : ${room.size} chatter${room.size > 1 ? 's' : ''} `}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '25%',
                      }}
                    >
                      <Typography sx={{ rotate: '-90deg' }} color="text.secondary">
                        {room.code}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </Box>
    </>
  )
}

export default Acceuil