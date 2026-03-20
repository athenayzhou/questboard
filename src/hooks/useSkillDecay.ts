import { useEffect } from "react";
import { DECAY } from "../utils/constants";
import { DecaySystem } from "../utils/skill/analysis/decay";

export type UseSkillDecayOptions = {
  bootstrapSettled?: boolean;
}

export function useSkillDecay(options?: UseSkillDecayOptions) {
  const bootstrapSettled = options?.bootstrapSettled ?? true;

  useEffect(() => {
    if(!bootstrapSettled) return;

    DecaySystem.processAllDecay();
    const interval = setInterval(
      () => DecaySystem.processAllDecay(),
      DECAY.DECAY_CHECK_INTERVAL
    );
    return () => clearInterval(interval);
  }, [bootstrapSettled]);
}