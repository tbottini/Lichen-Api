export interface Request<Query> {
  query: Partial<Query>
}

export interface RequestWithUser<Query> extends Request<Query> {
  user: {
    id: number
  }
}
