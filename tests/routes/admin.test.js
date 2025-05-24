/* eslint-env jest */
'use strict'

const request = require('supertest')
const createApp = require('@config/express')

describe('Admin Routes', () => {
  let app

  beforeEach(() => {
    app = createApp()
  })

  describe('Admin Page', () => {
    test('should serve admin page', async () => {
      const response = await request(app)
        .get('/admin')

      expect(response.status).toBe(200)
      expect(response.type).toBe('text/html')
    })
  })

  describe('Logs API', () => {
    test('should return logs in JSON format', async () => {
      const response = await request(app)
        .get('/admin/logs')

      expect(response.status).toBe(200)
      expect(response.type).toBe('application/json')
      expect(Array.isArray(response.body)).toBe(true)
    })

    test('should include request logs after making requests', async () => {
      // Make a sample request that will be logged (e.g., start game)
      await request(app)
        .post('/gaming/start')
        .send({ gameID: 1 })
        .set('Cookie', ['gameID=1', 'playerID=1'])

      // Then check logs
      const response = await request(app)
        .get('/admin/logs')

      expect(response.body.length).toBeGreaterThan(0)
      expect(response.body[0]).toHaveProperty('players')
      expect(response.body[0]).toHaveProperty('action')
      expect(response.body[0]).toHaveProperty('details')
    })
  })
})
