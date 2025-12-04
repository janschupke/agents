export enum AgentType {
  GENERAL = 'GENERAL',
  LANGUAGE_ASSISTANT = 'LANGUAGE_ASSISTANT',
}

export enum ResponseLength {
  SHORT = 'short',
  STANDARD = 'standard',
  LONG = 'long',
  ADAPT = 'adapt',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non-binary',
  PREFER_NOT_TO_SAY = 'prefer-not-to-say',
}

export enum Sentiment {
  NEUTRAL = 'neutral',
  ENGAGED = 'engaged',
  FRIENDLY = 'friendly',
  ATTRACTED = 'attracted',
  OBSESSED = 'obsessed',
  DISINTERESTED = 'disinterested',
  ANGRY = 'angry',
}

export enum Availability {
  AVAILABLE = 'available',
  STANDARD = 'standard',
  BUSY = 'busy',
}
