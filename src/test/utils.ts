import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import type { Quest } from '../types/quest'
import type { Skill } from '../types/skills'

export const renderWithProviders = (ui: ReactElement) => {
  return render(ui)
}

export const resetStores = () => {
  localStorage.clear()
}

export const resetAllStores = resetStores

export const createTestQuest = (overrides: Partial<Quest> = {}): Quest => ({
  id: 'test-quest-id',
  title: 'test quest',
  description: 'description for test quest',
  difficulty: 'medium' as const,
  status: 'available' as const,
  createdAt: Date.now(),
  ...overrides
})

export const createTestSkill = (overrides: Partial<Skill> = {}): Skill => ({
  id: 'test-skill-id',
  key: 'test-skill',
  name: 'test skill',
  verb: 'test',
  objects: ['object'],
  xp: 50,
  proficiency: 0.5,
  firstSeenAt: Date.now(),
  lastSeenAt: Date.now(),
  lastDecayAt: Date.now(),
  isDormant: false,
  ...overrides
})