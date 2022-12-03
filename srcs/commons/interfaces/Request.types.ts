export interface Request<Query> {
  query: Partial<Query>
}

export interface RequestWithUser<Query> extends Request<Query> {
  user: {
    id: number
  }
}

export interface RequestMaybeWithUser<Query> extends Request<Query> {
  user?: {
    id: number
  }
}
