import { Scene } from "./components/Scene";
import { OverlayManager } from "./components/overlay/OverlayManager";
import { useState, useRef, useEffect } from "react";
import { OrbitToggle } from "./components/ui/OrbitToggle";
import { useOverlay } from "./store/overlay";
import { Canvas } from "@react-three/fiber";
import { ActiveQuest } from "./components/secondary/ActiveQuests";

import { useShopStore } from "./store/shop";
import { DEFAULT_SHOP_ITEMS } from "./data/systemItems";

import { ToastProvider } from "./store/toast";
import { ConfirmProvider } from "./store/confirmation";
import { ToastContainer } from "./components/ui/Toast";
import { useRecurringQuests } from "./hooks/useRecurringQuests";
import { useSystemQuests } from "./hooks/useSystemQuests";
import { SkillActivityLog } from "./components/ui/SkillActivityLog";
import { useBootstrap } from "./hooks/useBootstrap";
import { BetaInviteGate } from "./components/auth/BetaInviteGate";
import { NamePrompt } from "./hooks/onQuestComplete";
import { useSkillDecay } from "./hooks/useSkillDecay";
import { StatusSync } from "./components/StatusSync";

function BootstrapLoadingShell() {
  return (
    <div
      className="bootstrap-shell bootstrap-shell--loading"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading questboard"
    >
      <div className="bootstrap-shell-inner">
        <div className="bootstrap-skeleton-logo" aria-hidden />
        <div className="bootstrap-skeleton-lines" aria-hidden>
          <div className="bootstrap-skeleton-line bootstrap-skeleton-line--long" />
          <div className="bootstrap-skeleton-line bootstrap-skeleton-line--medium" />
        </div>
        <p className="bootstrap-shell-title">Loading your questboard…</p>
        <p className="bootstrap-shell-detail">
          Syncing quests, skills, and progress from the server.
        </p>
      </div>
    </div>
  );
}

function BootstrapErrorShell(props: {
  error: string | null;
  onRetry: () => void;
}) {
  const retryRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    retryRef.current?.focus();
  }, []);

  return (
    <div
      className="bootstrap-shell bootstrap-shell--error"
      role="alert"
      aria-live="assertive"
    >
      <div className="bootstrap-shell-inner">
        <div className="bootstrap-shell-error-mark" aria-hidden>
          !
        </div>
        <p className="bootstrap-shell-title">Could not load your data</p>
        <p className="bootstrap-shell-detail">{props.error}</p>
        <div className="bootstrap-shell-actions">
          <button
            ref={retryRef}
            type="button"
            className="bootstrap-shell-btn bootstrap-shell-btn--primary"
            onClick={props.onRetry}
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

function QuestboardMain() {
  const [orbitUser, setOrbitUser] = useState(true);
  const activeOverlay = useOverlay((s) => s.activeOverlay);
  const overlayOpen = activeOverlay !== null;
  const orbitEnabled = orbitUser && !overlayOpen;

  useEffect(() => {
    useShopStore.getState().setItems(DEFAULT_SHOP_ITEMS);
  }, []);

  return (
    <>
      <StatusSync />
      <div id="root">
        <Canvas resize={{ scroll: false }}>
          <Scene orbitEnabled={orbitEnabled} resetCamera={!orbitUser} />
        </Canvas>
        <OrbitToggle enabled={orbitUser} toggle={() => setOrbitUser((v) => !v)} />
        <div id="html-layer" />
        <ActiveQuest />
        <SkillActivityLog />
        <OverlayManager />
        <div id="windows" />
        <NamePrompt />
      </div>
    </>
  );
}

function AppBootstrapBody() {
  const { status: bootstrapStatus, error, retry } = useBootstrap();
  const bootstrapSettled = bootstrapStatus !== "loading";
  const bootstrapReady = bootstrapStatus === "ready";

  useSkillDecay({ bootstrapSettled });
  useRecurringQuests({ bootstrapSettled, bootstrapReady });
  useSystemQuests({ bootstrapSettled });

  if (bootstrapStatus === "loading") {
    return <BootstrapLoadingShell />;
  }

  if (bootstrapStatus === "error") {
    return <BootstrapErrorShell error={error} onRetry={retry} />;
  }

  if (bootstrapStatus === "unauthorized") {
    return <BetaInviteGate onSignedIn={retry} />;
  }

  return <QuestboardMain />;
}

export default function App() {
  return (
    <ConfirmProvider>
      <ToastProvider>
        <ToastContainer />
        <AppBootstrapBody />
      </ToastProvider>
    </ConfirmProvider>
  );
}
