import { useEffect } from "react";
import { useSkillStore } from "../store/skill";
import { DECAY } from "../utils/constants";
import { clusterStore, candidateStore } from "../store/bundledStores";
import { devLog } from "../dev/devLogs";

export function useSkillDecay() {
  useEffect(() => {
    const now = Date.now()
    
    const processDecay = useSkillStore.getState().processDecay;
    processDecay();
    clusterStore.decay(now);
    candidateStore.decay(now);

    devLog('decay', 'decay run', { now });
    const interval = setInterval(processDecay, DECAY.DECAY_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);
}