export type BotButton = {
  id: string
  text: string
  kind: 'next' | 'url' | 'action'
  nextStepId?: string    // для kind="next"
  url?: string           // для kind="url"
  action?: 'open_catalog' | 'open_top_games' | 'open_lab' | 'noop' // расширяемо
}

export type BotStepContent =
  | { type: 'message'; text: string; parseMode?: 'HTML' | 'MarkdownV2'; entitiesJson?: any }
  | { type: 'photo'; imageUrl: string; caption?: string; parseMode?: 'HTML' | 'MarkdownV2'; entitiesJson?: any }

export type BotStep = {
  id: string
  name: string
  content: BotStepContent
  buttons?: BotButton[]
}

export type BotFlow = {
  id: string
  name: string
  trigger: 'start' | 'menu' | 'help' | 'custom'
  startStepId: string
  enabled: boolean
  steps: BotStep[]
  updatedAt: string
}

export type BotUserState = {
  tgId: number
  currentFlowId?: string
  currentStepId?: string
  updatedAt: string
}



