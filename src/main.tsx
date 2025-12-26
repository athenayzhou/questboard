import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

import './styles/base.css'
import './styles/labels.css'
import './styles/overlay.css'
import './styles/overlay/active-quest.css'
import './styles/overlay/friend-list.css'
import './styles/overlay/profile.css'
import './styles/overlay/quest-board.css'
import './styles/overlay/quest-log.css'
import './styles/overlay/setting.css'
import './styles/ui/badges.css'
import './styles/ui/buttons.css'
import './styles/ui/progress-bar.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
