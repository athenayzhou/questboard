import { useEffect } from "react";
import { DECAY } from "../utils/constants";
import { DecaySystem } from "../utils/skill/analysis/decay";

export function useSkillDecay() {
  useEffect(() => {
    DecaySystem.processAllDecay();
    const interval = setInterval(
      () => DecaySystem.processAllDecay(),
      DECAY.DECAY_CHECK_INTERVAL
    );
    return () => clearInterval(interval);
  }, []);
}