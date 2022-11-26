import { Medium } from '@prisma/client'

//todo rename on MEDIUM
export const mediumDict = {
  LIVING_ARTS: Medium.LIVING_ARTS,
  DRAWING: Medium.DRAWING,
  EDITING: Medium.EDITING,
  STAMP: Medium.STAMP,
  INSTALLATION: Medium.INSTALLATION,
  PAINTING: Medium.PAINTING,
  PHOTOGRAPH: Medium.PHOTOGRAPH,
  SCULPTURE: Medium.SCULPTURE,
  STREET_ART: Medium.STREET_ART,
  MIXED_TECHNIQUE: Medium.MIXED_TECHNIQUE,
  AUDIOVISUAL: Medium.AUDIOVISUAL,
} as const

export type MediumValues = typeof mediumDict[keyof typeof mediumDict]
