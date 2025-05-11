/* eslint-env jest */
const accountFunctions = require('@controllers/accountFunctions')
const { accounts } = accountFunctions

describe('Account Functions', () => {
  beforeEach(() => {
    // Clear all accounts before each test
    while (accountFunctions.createAccount.accounts && accountFunctions.createAccount.accounts.length > 0) {
      accountFunctions.createAccount.accounts.pop()
    }
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
})
