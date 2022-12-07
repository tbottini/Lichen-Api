import { Position } from '../../interfaces/Position.type'
import { IncludesUsers, UserBase } from '../repositories/Users.scope'

export type GetSelfDto = UserBase & {
  defaultPosition: Position | null
  email: string
} & IncludesUsers
