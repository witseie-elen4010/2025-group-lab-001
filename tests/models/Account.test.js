/* eslint-env jest */
const accountFunctions = require('@controllers/accountFunctions')
const { otpAccounts } = require('@controllers/accountFunctions')
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
    expect(result.username).toBe('testuser')
    expect(result.playerId).toBeDefined()
    // Verify the account was actually created in the accounts array
    const createdAccount = accounts.find(acc => acc.username === 'testuser')
    expect(createdAccount).toBeDefined()
    expect(createdAccount.email).toBe('test@example.com')
    expect(createdAccount.password).not.toBe('Password123') // Should be hashed
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
      }).toThrow('invalid signature')
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

describe('Additional Account Utility Functions', () => {
  beforeEach(() => {
    accounts.length = 0
  })

  test('checkIfUser should confirm existence of user by email', async () => {
    await accountFunctions.createAccount('exists@example.com', 'existsUser', 'Password123', 'Password123')
    const result = await accountFunctions.checkIfUser('exists@example.com')
    expect(result).toBe(true)
  })

  test('checkIfUser should return error for non-existing email', async () => {
    const result = await accountFunctions.checkIfUser('nonexistent@example.com')
    expect(result).toBeInstanceOf(Error)
    expect(result.message).toBe('Account not found')
  })

  test('getUsername should return correct username from email', async () => {
    await accountFunctions.createAccount('user@example.com', 'userName', 'Password123', 'Password123')
    const username = await accountFunctions.getUsername('user@example.com')
    expect(username).toBe('userName')
  })

  test('getUsername should return error for unknown email', async () => {
    const result = await accountFunctions.getUsername('nope@example.com')
    expect(result).toBeInstanceOf(Error)
    expect(result.message).toBe('Account not found')
  })

  test('getEmail should return correct email from username', async () => {
    await accountFunctions.createAccount('mail@example.com', 'mailuser', 'Password123', 'Password123')
    const email = await accountFunctions.getEmail('mailuser')
    expect(email).toBe('mail@example.com')
  })

  test('getEmail should return error for unknown username', async () => {
    const result = await accountFunctions.getEmail('unknownuser')
    expect(result).toBeInstanceOf(Error)
    expect(result.message).toBe('Account not found')
  })
})

describe('OTP Functions', () => {
  let otp, email, username

  beforeEach(async () => {
    accounts.length = 0
    otpAccounts.length = 0
    email = 'otpuser@example.com'
    username = 'otpuser'
    await accountFunctions.createAccount(email, username, 'Password123', 'Password123')
  })

  test('generateOTP should return a 4-digit string', async () => {
    const otp = await accountFunctions.generateOTP()
    expect(otp).toMatch(/^\d{4}$/)
  })

  test('sendOTP should send and store OTP for user', async () => {
    otp = await accountFunctions.sendOTP(email)
    expect(otp).toMatch(/^\d{4}$/)
  })

  test('verifyOTP should confirm valid OTP', async () => {
    otp = await accountFunctions.sendOTP(email)
    const result = await accountFunctions.verifyOTP(username, otp)
    expect(result).toBe(true)
  })

  test('verifyOTP should fail for incorrect OTP', async () => {
    await accountFunctions.sendOTP(email)
    const result = await accountFunctions.verifyOTP(username, '0000')
    expect(result).toBeInstanceOf(Error)
    expect(result.message).toBe('Invalid OTP')
  }, 10000)

  test('sendOTP should delete old OTPs if more than one exists', async () => {
    otp = await accountFunctions.sendOTP(email)
    const otp2 = await accountFunctions.sendOTP(email) // This should replace the previous
    const result = await accountFunctions.verifyOTP(username, otp)
    expect(result).toBeInstanceOf(Error)
    expect(result.message).toBe('Invalid OTP')
    expect(otp2).not.toBe(otp)
  }, 10000)
})

describe('Password Reset', () => {
  const username = 'resetuser'
  const email = 'reset@example.com'
  const oldPassword = 'OldPass123'
  const newPassword = 'NewPass123'

  beforeEach(async () => {
    accounts.length = 0
    await accountFunctions.createAccount(email, username, oldPassword, oldPassword)
  })

  test('resetPassword should update the user password', async () => {
    const result = await accountFunctions.resetPassword(username, newPassword, newPassword)
    expect(result).toBe(true)

    const loginOld = await accountFunctions.loginAccount(email, oldPassword)
    expect(loginOld).toBeInstanceOf(Error)
    expect(loginOld.message).toBe('Incorrect password')

    const loginNew = await accountFunctions.loginAccount(email, newPassword)
    expect(loginNew).toHaveProperty('username', username)
  })

  test('resetPassword should fail if passwords do not match', async () => {
    const result = await accountFunctions.resetPassword(username, 'Pass1', 'Pass2')
    expect(result).toBeInstanceOf(Error)
    expect(result.message).toBe('Passwords do not match')
  })

  test('resetPassword should fail if user does not exist', async () => {
    const result = await accountFunctions.resetPassword('unknown', newPassword, newPassword)
    expect(result).toBeInstanceOf(Error)
    expect(result.message).toBe('Account not found')
  })
})
