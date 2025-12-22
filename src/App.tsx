import { Scene } from './components/Scene'
import { OverlayManager } from './components/OverlayManager'

function App() {

  return (
    <div style={{ width:"100vw", height:"100vh" }}>
      <Scene />
      <OverlayManager />
    </div>
  )
}

export default App
