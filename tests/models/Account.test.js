/* eslint-env jest */
const accountFunctions = require('@controllers/accountFunctions')
const jwt = require('jsonwebtoken')

describe('Account Functions', () => {
  describe('Password Reset Flow', () => {
    test('should generate and verify OTP', async () => {
      const otp = await accountFunctions.generateOTP()
      expect(otp).toMatch(/^\d{4}$/)
    })
  })

  describe('JWT Token Generation', () => {
    test('should generate valid JWT token', () => {
      const username = 'testuser'
      const playerId = 1

      const token = accountFunctions.generateToken(username, playerId)
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')

      expect(decoded).toHaveProperty('username', username)
      expect(decoded).toHaveProperty('playerId', playerId)
      expect(decoded).toHaveProperty('exp')
    })

    test('should generate different tokens for different users', () => {
      const token1 = accountFunctions.generateToken('user1', 123)
      const token2 = accountFunctions.generateToken('user2', 456)

      expect(token1).not.toBe(token2)
    })

    test('should reject tokens with invalid signature', () => {
      const token = accountFunctions.generateToken('testuser', 1)
      expect(() => {
        jwt.verify(token, 'wrong-secret-key')
      }).toThrow('invalid signature')
    })
  })
})
