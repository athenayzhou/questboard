import { onQuestComplete } from "../components/quest/onQuestComplete";
import { TEST_DATA } from "../data/TEST_DATA";

export function TEST_COMPLETE(){
// for (let i = 0; i < 8; i++) {
//     evidenceStore.updateEvidence("edit", "ui", 120);
//   }

  TEST_DATA.forEach((quest) => {
    // const t = Date.now() + i * 1000;
    onQuestComplete(quest);
  })
}
