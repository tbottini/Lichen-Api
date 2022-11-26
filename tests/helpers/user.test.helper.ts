// import { app } from '../../srcs'
import { app } from '../../srcs'
import { UserFixtureCreationDto, UserTestHandler } from '../userTestHandler'
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
}: UserFixtureCreationDto): Promise<any> {
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
    projects: [] as any[],
    events: [] as any[],
    geoReferenced: undefined as boolean | undefined,
  }

  user.projects = []

  if (projects && !Array.isArray(projects))
    throw 'UserTestHandler Projects attribute must be n array'
  for (let i = 0; projects && i < projects.length; i++) {
    const project = await UserTestHandler.createProject(token, projects[i])
    user.projects.push(project)
  }

  if (events != null && Array.isArray(events)) {
    user.events = (await UserTestHandler.createListEvent(
      token,
      events
    )) as any[]
  }

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
