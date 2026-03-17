import { playerStore } from '../store/player';
// import { questStore } from '../store/quest';
// import { skillStore } from '../store/skill';
import { friendsStore } from '../store/friends';
// import { clusterStore, candidateStore, evidenceStore } from '../store/bundledStores';
// import { TEST_BOARD } from './data/TEST_BOARD';
import { TEST_FRIENDS } from './data/TEST_FRIENDS';
import { TEST_PLAYER_DATA } from './data/TEST_PROFILE';
// import { TEST_SKILL } from './data/TEST_SKILL';
// import { onQuestComplete } from '../hooks/onQuestComplete';

export function setupTestData() {
  // clusterStore.clear();
  // candidateStore.clear();

  // const questState = questStore.getState();
  // if (!questState.quests.length) {
  //   questStore.setState({ ...questState, quests: structuredClone(TEST_BOARD) });
  // }

  const friendsState = friendsStore.getState();
  if (!friendsState.friends.length) {
    friendsStore.setState({ ...friendsState, friends: structuredClone(TEST_FRIENDS) });
  }

  playerStore.getState().setPlayer(structuredClone(TEST_PLAYER_DATA));

  // TEST_SKILL.forEach((quest) =>
  //   onQuestComplete(quest, { evidenceStore, clusterStore, candidateStore })
  // );
}