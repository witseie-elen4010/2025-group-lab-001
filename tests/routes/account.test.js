/* eslint-env jest */
'use strict'

const request = require('supertest')
const createApp = require('@config/express')
const accountFunctions = require('@controllers/accountFunctions')

// Mock all accountFunctions
jest.mock('@controllers/accountFunctions')

describe('Account Routes', () => {
  let app

  beforeEach(() => {
    app = createApp()
    jest.clearAllMocks()

    // Set up default mocks for commonly used functions
    accountFunctions.generateToken.mockReturnValue('mockedToken')
    accountFunctions.checkValidEmail.mockReturnValue(true)
    accountFunctions.checkValidUsername.mockReturnValue(true)
    accountFunctions.checkPasswordConfirmed.mockReturnValue(true)
    accountFunctions.checkEmailAvailable.mockResolvedValue(true)
    accountFunctions.checkUsernameAvailable.mockResolvedValue(true)
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
      const mockAccount = { username: 'testuser', playerId: 1 }
      accountFunctions.createAccount.mockResolvedValue(mockAccount)

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
      expect(response.header['set-cookie'][0]).toMatch(/token=mockedToken/)
      expect(accountFunctions.createAccount).toHaveBeenCalledWith(
        'test@example.com',
        'testuser',
        'Password123',
        'Password123'
      )
    })

    test('should redirect back with error for invalid email', async () => {
      accountFunctions.createAccount.mockResolvedValue(new Error('Invalid email format'))

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
      accountFunctions.createAccount.mockResolvedValue(new Error('Email is already in use'))

      const response = await request(app)
        .post('/createAccount')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123',
          confirmPassword: 'Password123'
        })
        .expect(302)

      expect(response.header.location).toMatch(/\/createAccount\?error=Email%20is%20already%20in%20use/)
    })

    test('should redirect back with error for invalid username', async () => {
      accountFunctions.createAccount.mockResolvedValue(new Error('Invalid username format'))

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
      accountFunctions.createAccount.mockResolvedValue(new Error('Username is already in use'))

      const response = await request(app)
        .post('/createAccount')
        .send({
          email: 'test@example.com',
          username: 'existinguser',
          password: 'Password123',
          confirmPassword: 'Password123'
        })
        .expect(302)

      expect(response.header.location).toMatch(/\/createAccount\?error=Username%20is%20already%20in%20use/)
    })

    test('should redirect back with error for mismatched passwords', async () => {
      accountFunctions.createAccount.mockResolvedValue(new Error('Passwords do not match'))

      const response = await request(app)
        .post('/createAccount')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123',
          confirmPassword: 'DifferentPassword'
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
    test('should login and redirect to home with valid credentials', async () => {
      const mockUser = { username: 'testuser', playerId: 1 }
      accountFunctions.loginAccount.mockResolvedValue(mockUser)

      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'Password123'
        })
        .expect(302)

      expect(response.header.location).toBe('/home')
      expect(response.header['set-cookie']).toBeTruthy()
      expect(response.header['set-cookie'][0]).toMatch(/token=mockedToken/)
      expect(accountFunctions.loginAccount).toHaveBeenCalledWith(
        'test@example.com',
        'Password123'
      )
    })

    test('should redirect back with error for non-existent email', async () => {
      accountFunctions.loginAccount.mockResolvedValue(new Error('Account not found'))

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
      accountFunctions.loginAccount.mockResolvedValue(new Error('Incorrect password'))

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
      accountFunctions.loginAccount.mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'Password123'
        })
        .expect(500)

      expect(response.text).toBe('Internal server error')
    })
  })

  describe('Forgot Password Flow', () => {
    describe('GET /forgotPassword', () => {
      test('should serve forgot password page', async () => {
        const response = await request(app)
          .get('/forgotPassword')
          .expect(200)
        expect(response.type).toBe('text/html')
      })
    })

    describe('POST /forgotPassword', () => {
      test('should send OTP and redirect to verify OTP page', async () => {
        accountFunctions.checkIfUser.mockResolvedValue(true)
        accountFunctions.sendOTP.mockResolvedValue('123456')
        accountFunctions.getUsername.mockResolvedValue('testuser')

        const response = await request(app)
          .post('/forgotPassword')
          .send({ email: 'test@example.com' })
          .expect(302)

        expect(response.header.location).toBe('/verifyOTP')
        expect(response.header['set-cookie']).toBeTruthy()
        expect(response.header['set-cookie'][0]).toMatch(/username=testuser/)
      })

      test('should redirect back with error for non-existent email', async () => {
        accountFunctions.checkIfUser.mockResolvedValue(new Error('Account not found'))

        const response = await request(app)
          .post('/forgotPassword')
          .send({ email: 'nonexistent@example.com' })
          .expect(302)

        expect(response.header.location).toMatch(/\/forgotPassword\?error=Account%20not%20found/)
      })
    })

    describe('POST /verifyOTP', () => {
      test('should verify OTP and redirect to reset password page', async () => {
        accountFunctions.verifyOTP.mockResolvedValue(true)

        const response = await request(app)
          .post('/verifyOTP')
          .set('Cookie', ['username=testuser'])
          .send({ otp: '123456' })
          .expect(302)

        expect(response.header.location).toBe('/resetPassword')
      })

      test('should redirect back with error for invalid OTP', async () => {
        accountFunctions.verifyOTP.mockResolvedValue(new Error('Invalid OTP'))

        const response = await request(app)
          .post('/verifyOTP')
          .set('Cookie', ['username=testuser'])
          .send({ otp: '000000' })
          .expect(302)

        expect(response.header.location).toMatch(/\/verifyOTP\?error=Invalid%20OTP/)
      })
    })

    describe('POST /resetPassword', () => {
      test('should reset password and redirect to login', async () => {
        accountFunctions.resetPassword.mockResolvedValue(true)

        const response = await request(app)
          .post('/resetPassword')
          .set('Cookie', ['username=testuser'])
          .send({
            password: 'NewPassword123',
            confirmPassword: 'NewPassword123'
          })
          .expect(302)

        expect(response.header.location).toBe('/passwordReset')
      })

      test('should redirect back with error for mismatched passwords', async () => {
        accountFunctions.resetPassword.mockResolvedValue(new Error('Passwords do not match'))

        const response = await request(app)
          .post('/resetPassword')
          .set('Cookie', ['username=testuser'])
          .send({
            password: 'NewPassword123',
            confirmPassword: 'DifferentPassword'
          })
          .expect(302)

        expect(response.header.location).toMatch(/\/resetPassword\?error=Passwords%20do%20not%20match/)
      })
    })
  })
})
