import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

var data = null

async function setup() {
  var results = await prisma.user.createMany({
    data: [
      {
        firstname: 'george',
        lastname: 'orwell',
        email: 'les.animaux@bigbrother.com',
        password: 'notEffiscientPassword@1234,',
        events: {
          create: [],
        },
        projects: {
          create: [
            {
              title: 'project#1',
              artworks: {
                create: [
                  {
                    title: 'g.artwork#1.1',
                    src: 'test',
                  },
                  {
                    title: 'g.artwork#1.2',
                    src: 'test2',
                  },
                  {
                    title: 'g.artwork#1.3',
                    src: 'test3',
                  },
                ],
              },
            },
            {
              title: 'project#2',
              artworks: {
                create: [
                  {
                    title: 'g.artwork#2.1',
                    src: 'test',
                  },
                ],
              },
            },
          ],
        },
      },
      {
        firstname: 'mathias',
        lastname: 'boom',
        email: 'm.b@cthululu.com',
        password: 'notEffiscientPassword@154,',
        projects: {
          create: [
            {
              title: 'project#1',
              artworks: {
                create: [
                  {
                    title: 'm.artwork#1.1',
                    src: 'test',
                  },
                  {
                    title: 'm.artwork#1.2',
                    src: 'test2',
                  },
                  {
                    title: 'g.artwork#1.3',
                    src: 'test3',
                  },
                ],
              },
            },
            {
              title: 'project#2',
              artworks: {
                create: [
                  {
                    title: 'g.artwork#2.1',
                    src: 'test',
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  })

  data = results
}

async function clear() {
  await prisma.user.deleteMany({
    where: {
      OR: data.map(r => r.id),
    },
    data: {
      projects: {
        include: {
          artworks: true,
        },
      },
      events: true,
      artworksLike: true,
      eventsFollow: true,
    },
  })
}

module.exports = { setup, clear }
