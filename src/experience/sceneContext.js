import { createContext, useContext } from 'react'

export const SceneContext = createContext(null)

export function useSceneContext() {
  const context = useContext(SceneContext)

  if (!context) {
    throw new Error('useSceneContext must be used within SceneContext provider')
  }

  return context
}
