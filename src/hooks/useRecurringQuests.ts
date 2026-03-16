import { useEffect } from "react";
import { useQuestStore } from "../store/quest";
import { MS } from "../utils/constants";

export function useRecurringQuests(){
  useEffect(() => {
    const run = () => {
      useQuestStore.getState().processAutoFail();
      useQuestStore.getState().processRecurrence();
    };
    const interval = setInterval(run, MS.HOUR);
    run();
    return () => clearInterval(interval);
  }, []);
}