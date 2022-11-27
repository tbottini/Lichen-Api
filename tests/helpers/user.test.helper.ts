// import { app } from '../../srcs'
import { Event, Gallery, User } from '@prisma/client'
import { app } from '../../srcs'
import {
  UserFixtureCreationDto,
  UserTestHandler,
  ProjectWithArtworks,
  ProjectCreateInput,
  EventCreateInput,
} from '../userTestHandler'
const request = require('supertest')

export async function createUserList(listData: UserFixtureCreationDto[]) {
  // var users = await Promise.all(listData.map(async (data) => await this.addUser(data)));

  let u
  const userArray: any[] = []

  for (let i = 0; i < listData.length; i++) {
    u = await addUser(listData[i])
    userArray.push(u)
  }
  return userArray
}

export async function addUser({
  email,
  firstname,
  lastname,
  projects,
  latitude,
  longitude,
  events,
  medium,
  geoReferenced,
}: UserFixtureCreationDto): Promise<any & UserFixture> {
  const DEFAULT_PASSWORD = 'PasswordTest1234@,'

  let dataRequest = {
    email,
    firstname,
    lastname,
    password: DEFAULT_PASSWORD,
    medium,
  }

  let res = await request(app).post('/users/register').send(dataRequest)

  res = await request(app).post('/users/login').send({
    email: email,
    password: DEFAULT_PASSWORD,
  })

  expect(res.body).toHaveProperty('token')
  const token = res.body.token

  if (longitude && latitude) {
    const gallery = await UserTestHandler.updateGallery(token, {
      longitude,
      latitude,
    })
    dataRequest = {
      ...dataRequest,
      ...gallery,
    }
  }

  const user = {
    token: token,
    ...dataRequest,
    projects: [] as ProjectWithArtworks[],
    events: [] as Event[] | undefined,
    geoReferenced: false,
  }

  user.projects = await createProjects(token, projects)
  user.events = await createEvents(token, events)

  if (geoReferenced == true) {
    await request(app)
      .put('/users/')
      .set('Authorization', 'bearer ' + token)
      .send({
        geoReferenced: true,
      })
    user.geoReferenced = true
  }

  return user
}

async function createEvents(
  token: string,
  events: EventCreateInput[] | undefined
): Promise<Event[] | undefined> {
  if (events != null && Array.isArray(events)) {
    return await UserTestHandler.createListEvent(token, events)
  }
}

async function createProjects(
  token: string,
  projectsInput?: ProjectCreateInput[]
) {
  const projectsCreated: ProjectWithArtworks[] = []

  if (projectsInput && !Array.isArray(projectsInput))
    throw 'UserTestHandler Projects attribute must be n array'
  for (let i = 0; projectsInput && i < projectsInput.length; i++) {
    const project = await UserTestHandler.createProject(token, {
      title: projectsInput[i].title,
      artworks: projectsInput[i].artworks.map(a => ({
        title: a.title,
        medium: a.medium,
      })),
    })
    projectsCreated.push(project)
  }
  return projectsCreated
}

type UserFixture = Partial<Gallery> &
  User & {
    token: string
    projects: ProjectWithArtworks[]
    events: Event[] | undefined
    geoReferenced: boolean | undefined
  }
