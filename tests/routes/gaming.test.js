/* eslint-env jest */
const request = require('supertest')
const createApp = require('../../src/config/express')

describe('Gaming Routes', () => {
  let app

  beforeEach(() => {
    app = createApp()
  })

  test('should redirect to home when accessing game without cookies', async () => {
    const response = await request(app).get('/gaming/waiting')
    expect(response.status).toBe(302)
    expect(response.headers.location).toBe('/')
  })

  test('should access waiting room with valid cookies', async () => {
    // First create a game
    const createResponse = await request(app).get('/create')
    const cookies = createResponse.headers['set-cookie']

    const response = await request(app)
      .get('/gaming/waiting')
      .set('Cookie', cookies)

    expect(response.status).toBe(200)
  })

  test('should get player list for valid game', async () => {
    // First create a game
    const createResponse = await request(app).get('/create')
    const cookies = createResponse.headers['set-cookie']

    const response = await request(app)
      .get('/gaming/players')
      .set('Cookie', cookies)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('players')
    expect(response.body.players).toBeInstanceOf(Array)
  })
})
