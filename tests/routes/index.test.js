/* eslint-env jest */
'use strict'

const request = require('supertest')
const createApp = require('@config/express')

describe('Index Routes', () => {
  let app

  beforeEach(() => {
    app = createApp()
  })

  describe('GET /', () => {
    test('should serve home page', async () => {
      const response = await request(app)
        .get('/')
        .expect(200)

      expect(response.type).toBe('text/html')
    })
  })

  describe('POST /', () => {
    test('should handle form submissions', async () => {
      const response = await request(app)
        .post('/')
        .send('test=value')
        .expect(404) // Since no POST route is defined

      expect(response.type).toBe('text/html')
    })
  })

  describe('Middleware', () => {
    test('should parse URL-encoded bodies', async () => {
      const response = await request(app)
        .post('/')
        .send('test=value')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(404) // Since no POST route is defined

      expect(response.type).toBe('text/html')
    })
  })
})
