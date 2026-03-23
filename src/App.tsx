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
import { SkillActivityLog } from "./components/SkillActivityLog";
import { useBootstrap } from "./hooks/useBootstrap";
import { BetaInviteGate } from "./beta/BetaInviteGate";
import { WelcomeGate } from "./onboarding/WelcomeGate";
import { NamePrompt } from "./hooks/onQuestComplete";
import { TutorialSkillNamePrompt } from "./onboarding/TutorialSkillNamePrompt";
import { useSkillDecay } from "./hooks/useSkillDecay";
import { StatusSync } from "./components/StatusSync";
import { useTutorialQuestBootstrap } from "./onboarding/useTutorial";
import { TutorialSpotlight } from "./onboarding/TutorialSpotlight";
import { TutorialCompleteModal } from "./onboarding/TutorialCompleteModal";
import { useUserStore } from "./store/user";
import { useTutorialStore } from "./onboarding/tutorialStore";
import {
  boardTabForSpotlight,
  overlayForSpotlight,
} from "./onboarding/tutorialOverlaySync";
import {
  isTutorialSpotlightAllowed,
  shouldAdvanceTutorialOnDataSpotlightClick,
} from "./onboarding/tutorialGating";
import { useEffectiveTutorialSpotlight } from "./onboarding/useEffectiveTutorialSpotlight";
import { shouldBlockTutorialPointerEvent } from "./onboarding/tutorialSequence";
import type { SpotlightTarget } from "./onboarding/tutorialTypes";
import { useQuestStore } from "./store/quest";
import { isUnsetDisplayName } from "./lib/defaultUserData";
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
        <p className="bootstrap-shell-title">loading your questboard…</p>
        <p className="bootstrap-shell-detail">
          syncing quests, skills, and progress from the server
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
        <p className="bootstrap-shell-title">could not load data</p>
        <p className="bootstrap-shell-detail">{props.error}</p>
        <div className="bootstrap-shell-actions">
          <button
            ref={retryRef}
            type="button"
            className="bootstrap-shell-btn bootstrap-shell-btn--primary"
            onClick={props.onRetry}
          >
            try again :(
          </button>
        </div>
      </div>
    </div>
  );
}

function QuestboardMain({ bootstrapReady }: { bootstrapReady: boolean }) {
  const [orbitUser, setOrbitUser] = useState(true);
  const activeOverlay = useOverlay((s) => s.activeOverlay);
  const boardTab = useOverlay((s) => s.boardTab);
  const openOverlay = useOverlay((s) => s.openOverlay);
  const setBoardTab = useOverlay((s) => s.setBoardTab);
  const overlayOpen = activeOverlay !== null;
  const orbitEnabled = orbitUser && !overlayOpen;
  const { isActive, currentSubquest } = useTutorialStore();
  const quests = useQuestStore((s) => s.quests);

  const effectiveSpotlight = useEffectiveTutorialSpotlight();

  useTutorialQuestBootstrap({ bootstrapReady });

  useEffect(() => {
    function tryStartTutorial() {
      if (!bootstrapReady) return;
      const tutorial = useTutorialStore.getState();
      if (tutorial.isActive || tutorial.completed) return;
      if (localStorage.getItem("tutorial-completed") === "true") return;
      const hasNewbieBadge = useUserStore
        .getState()
        .user.badges.unlockedBadges.includes("newbie");
      if (hasNewbieBadge) return;
      tutorial.startTutorial();
    }
    tryStartTutorial();
    const unsub = useTutorialStore.persist.onFinishHydration(() => {
      tryStartTutorial();
    });
    return unsub;
  }, [bootstrapReady]);


  useEffect(() => {
    if (!isActive) return;
    const raw = currentSubquest?.spotlight;
    if (!raw?.startsWith("entry-")) return;
    if (!isTutorialSpotlightAllowed(currentSubquest, quests)) return;
    const o = useOverlay.getState();
    if (o.activeOverlay !== null && o.activeOverlay !== "quests") {
      o.closeOverlay();
    }
    const after = useOverlay.getState();
    if (after.activeOverlay === "quests") {
      return;
    }
    if (after.openQuestPages.length > 0) {
      after.closeAllQuests();
    }
  }, [isActive, currentSubquest, quests]);

  useEffect(() => {
    if (!isActive) return;
    const spot = effectiveSpotlight as SpotlightTarget | undefined;
    if (!spot) return;
    const want = overlayForSpotlight(spot);
    if (want && activeOverlay !== want) {
      openOverlay(want);
    }
    const tab = boardTabForSpotlight(spot);
    if (tab && boardTab !== tab) {
      setBoardTab(tab);
    }
  }, [
    isActive,
    effectiveSpotlight,
    activeOverlay,
    boardTab,
    openOverlay,
    setBoardTab,
  ]);

  useEffect(() => {
    useShopStore.getState().setItems(DEFAULT_SHOP_ITEMS);
  }, []);

  useEffect(() => {
    const blockWrongSpotlight = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (shouldBlockTutorialPointerEvent(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };
    const blockWrongClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (shouldBlockTutorialPointerEvent(e.target as EventTarget)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };
    document.addEventListener("pointerdown", blockWrongSpotlight, true);
    document.addEventListener("click", blockWrongClick, true);

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const spotlightId = target.closest("[data-spotlight]")?.getAttribute("data-spotlight");
      if (spotlightId) {
        if (spotlightId === "profile-display-name") {
          return;
        }
        const state = useTutorialStore.getState();
        const sub = state.currentSubquest;
        if (
          sub &&
          shouldAdvanceTutorialOnDataSpotlightClick(
            spotlightId,
            useQuestStore.getState().quests,
            useOverlay.getState().activeOverlay,
          )
        ) {
          state.markSubquestComplete(sub.id);
        }
      }
    };
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("pointerdown", blockWrongSpotlight, true);
      document.removeEventListener("click", blockWrongClick, true);
      document.removeEventListener("click", handleClick);
    };
  }, []);


  return (
    <>
      <StatusSync />
      <div id="root">
        <Canvas resize={{ scroll: false }}>
          <Scene orbitEnabled={orbitEnabled} resetCamera={!orbitUser} />
        </Canvas>
        <div className="scene-control-dock">
          {isActive && (
            <button
              type="button"
              className="tutorial-spotlight-skip"
              aria-label="Skip tutorial"
              onClick={() => useTutorialStore.getState().skipTutorial()}
            >
              skip tutorial
            </button>
          )}
          <OrbitToggle enabled={orbitUser} toggle={() => setOrbitUser((v) => !v)} />
        </div>
        <div id="html-layer" />
        <ActiveQuest />
        <SkillActivityLog />
        <OverlayManager />
        <div id="windows" />
        <NamePrompt />
        <TutorialSkillNamePrompt />
        <TutorialCompleteModal />
        {isActive && <TutorialSpotlight activeSpotlight={effectiveSpotlight} />}
      </div>
    </>
  );
}

function AppBootstrapBody() {
  const { status: bootstrapStatus, error, retry } = useBootstrap();
  const bootstrapSettled = bootstrapStatus !== "loading";
  const bootstrapReady = bootstrapStatus === "ready";
  const userName = useUserStore((s) => s.user.profile?.name ?? "");
  const showWelcome = bootstrapReady && isUnsetDisplayName(userName);

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

  return (
    <div className="app-bootstrap-body" suppressHydrationWarning>
      {showWelcome ? (
        <WelcomeGate />
      ) : (
        <QuestboardMain bootstrapReady={bootstrapStatus === "ready"} />
      )}
    </div>
  );
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
