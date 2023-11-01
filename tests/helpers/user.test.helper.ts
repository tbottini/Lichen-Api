import { Event } from '@prisma/client'
import { app } from '../../srcs'
import {
  UserFixtureCreationDto,
  UserTestHandler,
  ProjectWithArtworks,
  ProjectCreateInput,
  EventCreateInput,
} from '../userTestHandler'
import { apiCreateUser, apiLogin, apiSelf } from './api.helpers'

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

export function apiCreateGallery(
  data: Pick<UserFixtureCreationDto, 'email' | 'pseudo' | 'medium' | 'events' | 'longitude' | 'latitude'>
) {
  return addUser(data)
}

export async function addUser({
  email,
  firstname,
  lastname,
  pseudo,
  projects,
  latitude,
  longitude,
  events,
  medium,
}: UserFixtureCreationDto): Promise<any> {
  const DEFAULT_PASSWORD = 'PasswordTest1234@,'

  let dataRequest = {
    email,
    firstname,
    lastname,
    pseudo,
    password: DEFAULT_PASSWORD,
    medium,
  }

  await apiCreateUser(dataRequest)

  const token = await apiLogin({ email })

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
  const self = await apiSelf(token)

  const user = {
    id: self.id,
    token: token,
    ...dataRequest,
    projects: [] as ProjectWithArtworks[],
    events: [] as Event[] | undefined,
  }

  user.projects = await createProjects(token, projects)
  user.events = await createEvents(token, events)

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
