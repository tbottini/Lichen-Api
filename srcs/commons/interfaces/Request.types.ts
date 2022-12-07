export interface Request<Query, Body> {
  query: DeepPartial<Query>
  body: DeepPartial<Body>
}

export interface RequestWithUser<Query> extends Request<Query, unknown> {
  user: {
    id: number
  }
}

export interface UserRequestWithBody<Body> extends Request<unknown, Body> {
  user: {
    id: number
  }
}

export interface RequestMaybeWithUser<Query> extends Request<Query, unknown> {
  user?: {
    id: number
  }
}

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T
