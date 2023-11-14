import { Event, Prisma } from '@prisma/client'
import { prisma } from '../../srcs/commons/prisma/prisma'

export async function createEvent(
  data: Prisma.EventUncheckedCreateInput
): Promise<Event> {
  return prisma.event.create({
    data,
  })
}
