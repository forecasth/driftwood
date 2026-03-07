import { useCallback, useState } from 'react'
import * as Tone from 'tone'
import './App.css'
import EntryPage from './entry/EntryPage.jsx'
import Scene from './experience/Scene.jsx'

function App() {
  const [hasEntered, setHasEntered] = useState(false)
  const [autoStartAudio, setAutoStartAudio] = useState(false)
  const handleEnter = useCallback(() => {
    void Tone.start().catch(() => undefined)
    setAutoStartAudio(true)
    setHasEntered(true)
  }, [])

  return (
    <main className="app-shell">
      {hasEntered ? (
        <Scene autoStartAudio={autoStartAudio} />
      ) : (
        <EntryPage onEnter={handleEnter} />
      )}
    </main>
  )
}

export default App
