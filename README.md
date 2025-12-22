# questboard

maintains, organizes, and keeps track of chores to help me manage my chore workload

board with quests posted on it that each help do a chore
quest = paper with required actions listed, upon completion of set action promises a reward typically virtual currency

## quest based system

user generated quest

- input chore
- category: cooking, cleaning, etc (user created tags)
- difficulty: easy, medium, hard
- priority: high/urgent, low/flexible
- frequency: one time, daily, weekly, monthly, custom
- time duration
- deadline
- subquests
- chore turns into new quest added to quest board

## components

- board: freely rearrange quests, visible information (name, difficulty, time left), select quest to expand details (instructions/description, subquest, etc)
- quest page: expand information, edit information, accept/delete quest
- accept quest: adds quest to dashboard as active quest
- system generated quests: notification about quest issue pops up, accept (quest added to dashboard), defer (quest added to quest board) or reject
  - reoccurring quests (e.g. weekly dishes)
  - seasonal quests (e.g. spring cleaning, set clocks for daylight savings)
  - customized/personalized quests (e.g. bake dessert with chocolate if skill proficiency in baking is about to increase, introduce new branch like create own jam/syrup and after leveling baking skill, canning/preservation skill branches)
- quest templates: use pre-set templates for common chores, reissue past chore
- quest completion: completion marked, reward (currency/item) on quest awarded, exp for skill awarded
