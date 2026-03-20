import { useEffect, useRef } from "react";
import { useQuestStore } from "../store/quest";
import { MS } from "../utils/constants";

export type UseRecurringQuestsOptions = {
  bootstrapSettled?: boolean;
  bootstrapReady?: boolean;
};

export function useRecurringQuests(options?: UseRecurringQuestsOptions) {
  const bootstrapSettled = options?.bootstrapSettled ?? true;
  const bootstrapReady = options?.bootstrapReady ?? false;
  const ranAfterReady = useRef(false);

  useEffect(() => {
    if(!bootstrapSettled) return;

    const run = () => {
      useQuestStore.getState().processAutoFail();
      useQuestStore.getState().processRecurrence();
    };
    const interval = setInterval(run, MS.HOUR);
    run();
    return () => clearInterval(interval);
  }, [bootstrapSettled]);

  useEffect(() => {
    if(!bootstrapReady || ranAfterReady.current) return;
    ranAfterReady.current = true;
    useQuestStore.getState().processAutoFail();
    useQuestStore.getState().processRecurrence();
  }, [bootstrapReady]);
}