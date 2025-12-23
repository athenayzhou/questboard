import { Scene } from './components/Scene'
import { OverlayManager } from './components/OverlayManager'

function App() {

  return (
    <div id="root">
      <Scene />
      <div id="html-layer" />
      <OverlayManager />
    </div>
  )
}

export default App
