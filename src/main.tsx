import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { setupTestData } from './dev/devSetup';

import './styles/base.css';
import './styles/labels.css';
import './styles/overlay.css';
import './styles/overlay/active-quest.css';
import './styles/overlay/friend-list.css';
import './styles/overlay/profile.css';
import './styles/overlay/skill-ledger.css';
import './styles/overlay/quest-board.css';
import './styles/overlay/quest-log.css';
import './styles/overlay/setting.css';
import './styles/ui/badges.css';
import './styles/ui/buttons.css';
import './styles/ui/progress-bar.css';
import './styles/ui/toast.css';
import './styles/ui/confirm.css';

if (import.meta.env.DEV) {
  setupTestData();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
