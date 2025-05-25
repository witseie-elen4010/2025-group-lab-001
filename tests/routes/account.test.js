/* eslint-env jest */
'use strict'

const request = require('supertest')
const createApp = require('@config/express')
const accountFunctions = require('@controllers/accountFunctions')

describe('Account Routes', () => {
  let app

  beforeEach(() => {
    app = createApp()
    // Clear all accounts before each test
    accountFunctions.accounts.length = 0
  })

  describe('GET /', () => {
    test('should serve accounts page', async () => {
      const response = await request(app)
        .get('/')
        .expect(200)

      expect(response.type).toBe('text/html')
    })
  })

  describe('GET /createAccount', () => {
    test('should serve create account page', async () => {
      const response = await request(app)
        .get('/createAccount')
        .expect(200)

      expect(response.type).toBe('text/html')
    })
  })

  describe('POST /createAccount', () => {
    test('should create account and redirect to home with valid data', async () => {
      const response = await request(app)
        .post('/createAccount')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123',
          confirmPassword: 'Password123'
        })
        .expect(302)

      expect(response.header.location).toBe('/home')
      expect(response.header['set-cookie']).toBeTruthy()
      expect(response.header['set-cookie'][0]).toMatch(/token=/)
    })

    test('should redirect back with error for invalid email', async () => {
      const response = await request(app)
        .post('/createAccount')
        .send({
          email: 'invalid-email',
          username: 'testuser',
          password: 'Password123',
          confirmPassword: 'Password123'
        })
        .expect(302)

      expect(response.header.location).toMatch(/\/createAccount\?error=Invalid%20email%20format/)
    })

    test('should redirect back with error for duplicate email', async () => {
      // Create first account
      await accountFunctions.createAccount(
        'test@example.com',
        'user1',
        'Password123',
        'Password123'
      )

      // Try to create second account with same email
      const response = await request(app)
        .post('/createAccount')
        .send({
          email: 'test@example.com',
          username: 'user2',
          password: 'Password123',
          confirmPassword: 'Password123'
        })
        .expect(302)

      expect(response.header.location).toMatch(/\/createAccount\?error=Email%20is%20already%20in%20use/)
    })

    test('should redirect back with error for invalid username', async () => {
      const response = await request(app)
        .post('/createAccount')
        .send({
          email: 'test@example.com',
          username: '!!!',
          password: 'Password123',
          confirmPassword: 'Password123'
        })
        .expect(302)

      expect(response.header.location).toMatch(/\/createAccount\?error=Invalid%20username%20format/)
    })

    test('should redirect back with error for duplicate username', async () => {
      // Create first account
      await accountFunctions.createAccount(
        'test1@example.com',
        'testuser',
        'Password123',
        'Password123'
      )

      // Try to create second account with same username
      const response = await request(app)
        .post('/createAccount')
        .send({
          email: 'test2@example.com',
          username: 'testuser',
          password: 'Password123',
          confirmPassword: 'Password123'
        })
        .expect(302)

      expect(response.header.location).toMatch(/\/createAccount\?error=Username%20is%20already%20in%20use/)
    })

    test('should redirect back with error for mismatched passwords', async () => {
      const response = await request(app)
        .post('/createAccount')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123',
          confirmPassword: 'Password456'
        })
        .expect(302)

      expect(response.header.location).toMatch(/\/createAccount\?error=Passwords%20do%20not%20match/)
    })
  })

  describe('GET /login', () => {
    test('should serve login page', async () => {
      const response = await request(app)
        .get('/login')
        .expect(200)

      expect(response.type).toBe('text/html')
    })
  })

  describe('POST /login', () => {
    beforeEach(async () => {
      // Create a test account
      await accountFunctions.createAccount(
        'test@example.com',
        'testuser',
        'Password123',
        'Password123'
      )
    })

    test('should login and redirect to home with valid credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'Password123'
        })
        .expect(302)

      expect(response.header.location).toBe('/home')
      expect(response.header['set-cookie']).toBeTruthy()
      expect(response.header['set-cookie'][0]).toMatch(/token=/)
    })

    test('should redirect back with error for non-existent email', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123'
        })
        .expect(302)

      expect(response.header.location).toMatch(/\/login\?error=Account%20not%20found/)
    })

    test('should redirect back with error for incorrect password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        })
        .expect(302)

      expect(response.header.location).toMatch(/\/login\?error=Incorrect%20password/)
    })

    test('should handle server error gracefully', async () => {
      // Mock accountFunctions.loginAccount to throw an error
      const originalLoginAccount = accountFunctions.loginAccount
      accountFunctions.loginAccount = jest.fn().mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'Password123'
        })
        .expect(500)

      expect(response.text).toBe('Internal server error')

      // Restore original function
      accountFunctions.loginAccount = originalLoginAccount
    })
  })
})
