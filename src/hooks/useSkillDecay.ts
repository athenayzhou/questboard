import { useEffect } from "react";
import { useSkillStore } from "../store/skill";
import { DECAY } from "../utils/constants";

export function useSkillDecay() {
  useEffect(() => {
    const processDecay = useSkillStore.getState().processDecay;
    processDecay();
    const interval = setInterval(processDecay, DECAY.DECAY_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);
}