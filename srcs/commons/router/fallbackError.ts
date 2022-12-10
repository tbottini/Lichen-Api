export async function tryCompleteRequest(
  res: Response,
  callback: () => unknown
) {
  try {
    await callback()
  } catch (e: any) {
    if (e.type == 'InternalError') {
      return res
        .status(500)
        .json(JSON.stringify(e, Object.getOwnPropertyNames(e)))
    }

    res.status(400).json(JSON.stringify(e, Object.getOwnPropertyNames(e)))
  }
}

interface Response {
  status(code: number): this
  json(e: unknown): void
}
