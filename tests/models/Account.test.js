/* eslint-env jest */
const accountFunctions = require('@controllers/accountFunctions')
const { accounts } = accountFunctions
const jwt = require('jsonwebtoken')

describe('Account Functions', () => {
  beforeEach(() => {
    // Clear all accounts before each test
    accounts.length = 0
  })

  test('should create a valid account', async () => {
    const result = await accountFunctions.createAccount(
      'test@example.com',
      'testuser',
      'Password123',
      'Password123'
    )

    expect(result).toBeInstanceOf(Object)
    expect(result.email).toBe('test@example.com')
    expect(result.username).toBe('testuser')
    expect(result.password).not.toBe('Password123') // Should be hashed
  })

  test('should reject invalid email', async () => {
    const result = await accountFunctions.createAccount(
      'invalid-email',
      'user1',
      'Password123',
      'Password123'
    )

    expect(result).toBeInstanceOf(Error)
    expect(result.message).toBe('Invalid email format')
  })

  test('should reject duplicate email', async () => {
    await accountFunctions.createAccount(
      'dup@example.com',
      'user2',
      'Password123',
      'Password123'
    )

    const result = await accountFunctions.createAccount(
      'dup@example.com',
      'user3',
      'Password123',
      'Password123'
    )

    expect(result).toBeInstanceOf(Error)
    expect(result.message).toBe('Email is already in use')
  })

  test('should reject invalid username', async () => {
    const result = await accountFunctions.createAccount(
      'user4@example.com',
      '!!!',
      'Password123',
      'Password123'
    )

    expect(result).toBeInstanceOf(Error)
    expect(result.message).toBe('Invalid username format')
  })

  test('should reject duplicate username', async () => {
    await accountFunctions.createAccount(
      'unique@example.com',
      'duplicateuser',
      'Password123',
      'Password123'
    )

    const result = await accountFunctions.createAccount(
      'newemail@example.com',
      'duplicateuser',
      'Password123',
      'Password123'
    )

    expect(result).toBeInstanceOf(Error)
    expect(result.message).toBe('Username is already in use')
  })

  test('should reject mismatched passwords', async () => {
    const result = await accountFunctions.createAccount(
      'user5@example.com',
      'user5',
      'Password123',
      'Password456'
    )

    expect(result).toBeInstanceOf(Error)
    expect(result.message).toBe('Passwords do not match')
  })

  test('should hash password correctly', async () => {
    const rawPassword = 'Password123'
    const hashed = await accountFunctions.hashPassword(rawPassword)

    expect(hashed).not.toBe(rawPassword)
    expect(hashed.length).toBeGreaterThan(0)
  })

  describe('loginAccount function', () => {
    const email = 'user@example.com'
    const username = 'user1'
    const password = 'securePass123'

    beforeEach(async () => {
      accounts.length = 0
      await accountFunctions.createAccount(email, username, password, password)
    })

    test('should login successfully with correct email and password', async () => {
      const result = await accountFunctions.loginAccount(email, password)
      expect(result).toBeDefined()
      expect(result).toHaveProperty('email', email)
      expect(result).toHaveProperty('username', username)
    })

    test('should return error if email not found', async () => {
      const result = await accountFunctions.loginAccount('notfound@example.com', password)
      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe('Account not found')
    })

    test('should return error if password is incorrect', async () => {
      const result = await accountFunctions.loginAccount(email, 'wrongPassword')
      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe('Incorrect password')
    })

    test('should return error if email is empty', async () => {
      const result = await accountFunctions.loginAccount('', password)
      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe('Account not found')
    })

    test('should return error if password is empty', async () => {
      const result = await accountFunctions.loginAccount(email, '')
      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe('Incorrect password')
    })
  })

  describe('JWT Authentication', () => {
    const testEmail = 'test@example.com'
    const testUsername = 'testuser'
    const testPassword = 'Password123'
    let testAccount

    beforeEach(async () => {
      testAccount = await accountFunctions.createAccount(
        testEmail,
        testUsername,
        testPassword,
        testPassword
      )
    })

    test('should generate valid JWT token with correct payload', () => {
      const token = accountFunctions.generateToken(testAccount.username, testAccount.playerId)
      const decoded = jwt.verify(token, 'your-secret-key')

      expect(decoded).toHaveProperty('username', testAccount.username)
      expect(decoded).toHaveProperty('playerId', testAccount.playerId)
      expect(decoded).toHaveProperty('exp')
      expect(decoded).not.toHaveProperty('password')
      expect(decoded).not.toHaveProperty('email')
    })

    test('should generate different tokens for different users', () => {
      const token1 = accountFunctions.generateToken('user1', 123)
      const token2 = accountFunctions.generateToken('user2', 456)

      expect(token1).not.toBe(token2)
    })

    test('should generate different tokens for same user at different times', async () => {
      const token1 = accountFunctions.generateToken(testAccount.username, testAccount.playerId)
      // Add a small delay
      await new Promise(resolve => setTimeout(resolve, 100))
      const token2 = accountFunctions.generateToken(testAccount.username, testAccount.playerId)
      expect(token1).not.toBe(token2)
    })

    test('should reject expired tokens', async () => {
      const token = jwt.sign(
        { username: testAccount.username, playerId: testAccount.playerId },
        'your-secret-key',
        { expiresIn: '1ms' }
      )

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(() => {
        jwt.verify(token, 'your-secret-key')
      }).toThrow('jwt expired')
    })

    test('should reject tokens with invalid signature', () => {
      const token = accountFunctions.generateToken(testAccount.username, testAccount.playerId)

      expect(() => {
        jwt.verify(token, 'wrong-secret-key')
      }).toThrow('invalid signature')
    })

    test('should reject tokens with modified payload', () => {
      const token = accountFunctions.generateToken(testAccount.username, testAccount.playerId)
      const [header, payload, signature] = token.split('.')
      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString())
      decodedPayload.username = 'hacker'
      const modifiedPayload = Buffer.from(JSON.stringify(decodedPayload)).toString('base64')
      const modifiedToken = `${header}.${modifiedPayload}.${signature}`

      expect(() => {
        jwt.verify(modifiedToken, 'your-secret-key')
      }).toThrow('invalid token')
    })

    test('should generate unique playerId for each account', async () => {
      const account1 = await accountFunctions.createAccount(
        'user1@example.com',
        'user1',
        'Password123',
        'Password123'
      )
      const account2 = await accountFunctions.createAccount(
        'user2@example.com',
        'user2',
        'Password123',
        'Password123'
      )

      expect(account1.playerId).toBeDefined()
      expect(account2.playerId).toBeDefined()
      expect(account1.playerId).not.toBe(account2.playerId)
    })

    test('should maintain consistent playerId across logins', async () => {
      const loginResult = await accountFunctions.loginAccount(testEmail, testPassword)
      expect(loginResult.playerId).toBe(testAccount.playerId)
    })
  })
})
