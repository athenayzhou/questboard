type QuestAction = {
  id: string
  text: string
  completed: boolean
}

type QuestReward = {
  coins?: number
  exp?: number
  items?: string[]
}

type Quest = {
  id: string
  title: string
  description?: string
  category?: string[]
  difficulty: "easy"|"medium"|"hard"
  priority?: "high"|"low"
  frequency?: "once"|"daily"|"weekly"|"monthly"|"custom"
  duration?: number
  deadline?: Date
  subquests?: QuestAction[]
  reward?: QuestReward
  status: "available"|"accepted"|"completed"
  createdAt: number
  updatedAt?: number
}