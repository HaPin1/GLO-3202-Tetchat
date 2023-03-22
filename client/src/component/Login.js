import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Container, Box, Typography, TextField, Button, Link, Alert } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'

function Login() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()
  const handleRegister = (data) => authenticate(data)
  const handleError = (errors) => {}

  const registerOptions = {
    username: { required: 'Username is required' },
    password: { required: 'Password is required' },
  }

  const username = localStorage.getItem('username')
  const [infoType, setInfoType] = useState('')
  const [infoText, setInfoText] = useState('')

  const authenticate = (data) => {
    const { username, password } = data
    setInfoType('')
    setInfoText('')

    axios
      .post(
        `${process.env.REACT_APP_API_URL}/logIn`,
        { username: username, password: password },
        { withCredentials: true }
      )
      .then((res) => {
        switch (res.status) {
          case 200:
            console.log(`User authenticated ${res.status}`)
            localStorage.setItem('username', username)
            setInfoType('success')
            setInfoText(`Welcome ${username}`)
            setTimeout(() => {
              navigate(`/`)
            }, 3000)
            break
          default:
            console.log(`Code inconnu ${res.status}`)
        }
      })
      .catch((err) => {
        const { data, status } = err.response
        switch (status) {
          case 400:
            console.log(`Register error ${status}, ${data.reason}`)
            setInfoType('error')
            setInfoText(data.reason)
            break
          default:
            console.log(`Unknown error ${status}`)
            setInfoType('error')
            setInfoText(data.reason)
        }
      })
  }

  useEffect(() => {
    if (username) {
      navigate(`/`)
    }
  }, [])

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <Box>
          <Box
            component="img"
            sx={{
              height: 100,
              width: 100,
            }}
            alt="tetchat logo"
            src={require('../data/tetchat.png')}
          />
          <Typography variant="h5" component="h1">
            Sign in
          </Typography>
        </Box>

        <Box component="form" noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            label="Username"
            fullWidth
            {...register('username', registerOptions.username)}
            error={errors?.username ? true : false}
            helperText={errors?.username && errors.username?.message}
          />
          <TextField
            margin="normal"
            label="Password"
            type="password"
            fullWidth
            {...register('password', registerOptions.password)}
            error={errors?.password ? true : false}
            helperText={errors?.password && errors.password?.message}
          />
          <Button
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            fullWidth
            onClick={handleSubmit(handleRegister, handleError)}
          >
            Sign In
          </Button>
          <Link
            onClick={() => {
              navigate(`/register`)
            }}
            variant="body2"
          >
            {"Don't have an account? Sign Up"}
          </Link>
          {infoType !== '' && infoText !== '' ? (
            infoType === 'error' ? (
              <Alert severity="error">{infoText}</Alert>
            ) : (
              <Alert severity="success">{infoText}</Alert>
            )
          ) : null}
        </Box>
      </Box>
    </Container>
  )
}

export default Login
