import { logger } from '../../modules/logger'

export async function tryCompleteRequest(
  res: Response,
  callback: () => unknown
) {
  try {
    await callback()
    return true
  } catch (e: any) {
    if (e.type == 'InternalError') {
      logger.error(e)

      return res
        .status(500)
        .json(JSON.stringify(e, Object.getOwnPropertyNames(e)))
    }

    res.status(400).json(JSON.stringify(e, Object.getOwnPropertyNames(e)))
    return false
  }
}

interface Response {
  status(code: number): this
  json(e: unknown): void
}
