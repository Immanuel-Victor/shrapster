import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { socket } from './socket';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [foo, setFoo] = useState(["aaaaaaaaa"]);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }
    
    function onFooEvent(value) {
      console.log(value)
      setFoo(previous => [...previous, value]);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('foo', onFooEvent);
  }, []);

  return (
    <>
      <h1>AAAAAAAAAAA {String(isConnected)}</h1>
      <h3>{foo.join(" ")}</h3>
    </>
  )
}

export default App
