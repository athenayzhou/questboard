import { useSyncExternalStore } from "react";
import { listenSkillLedger, getSkillLedger } from "../store/skillLedger";

export function useSkillLedger() {
    return useSyncExternalStore(
        listenSkillLedger,
        getSkillLedger,
        getSkillLedger
    );
}