import { useState } from "react";

export function useNamingModal() {
  const [isOpen, setOpen] = useState(false);
  const [currentSkill, setCurrentSkill] = useState<string | null>(null);

  function open(skillId: string) {
    setCurrentSkill(skillId);
    setOpen(true);
  }

  function close(){
    setCurrentSkill(null);
    setOpen(false);
  }

  return { isOpen, currentSkill, open, close };
}