import { Position } from '../../interfaces/Position.type'
import { IncludesUsers, UserBase } from '../repositories/Users.scope'

export type GetSelfDto = UserBase & {
  position: Position | null
  email: string
} & IncludesUsers
