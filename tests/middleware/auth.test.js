/* eslint-env jest */
const jwt = require('jsonwebtoken')
const { verifyToken } = require('@middleware/auth')

describe('Auth Middleware', () => {
  const mockRequest = () => {
    const req = {}
    req.cookies = {}
    return req
  }

  const mockResponse = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.redirect = jest.fn().mockReturnValue(res)
    return res
  }

  const mockNext = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should redirect to login if no token provided', () => {
    const req = mockRequest()
    const res = mockResponse()

    verifyToken(req, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.redirect).toHaveBeenCalledWith('/login')
    expect(mockNext).not.toHaveBeenCalled()
  })

  test('should set user data and call next with valid token', () => {
    const req = mockRequest()
    const res = mockResponse()
    const testUser = { username: 'testuser', playerId: 123 }
    const token = jwt.sign(testUser, 'your-secret-key')
    req.cookies.token = token

    verifyToken(req, res, mockNext)
    expect(req.user.username).toEqual(testUser.username)
    expect(req.user.playerId).toEqual(testUser.playerId)
    expect(mockNext).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
  })

  test('should redirect to login with invalid token', () => {
    const req = mockRequest()
    const res = mockResponse()
    req.cookies.token = 'invalid.token.here'

    verifyToken(req, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.redirect).toHaveBeenCalledWith('/login')
    expect(mockNext).not.toHaveBeenCalled()
  })

  test('should redirect to login with expired token', async () => {
    const req = mockRequest()
    const res = mockResponse()
    const testUser = { username: 'testuser', playerId: 123 }
    const token = jwt.sign(testUser, 'your-secret-key', { expiresIn: '1ms' })

    // Wait for token to expire
    await new Promise(resolve => setTimeout(resolve, 100))

    req.cookies.token = token
    verifyToken(req, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.redirect).toHaveBeenCalledWith('/login')
    expect(mockNext).not.toHaveBeenCalled()
  })

  test('should redirect to login with token signed with wrong secret', () => {
    const req = mockRequest()
    const res = mockResponse()
    const testUser = { username: 'testuser', playerId: 123 }
    const token = jwt.sign(testUser, 'wrong-secret-key')
    req.cookies.token = token

    verifyToken(req, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.redirect).toHaveBeenCalledWith('/login')
    expect(mockNext).not.toHaveBeenCalled()
  })

  test('should handle malformed token gracefully', () => {
    const req = mockRequest()
    const res = mockResponse()
    req.cookies.token = 'not.a.jwt.token'

    verifyToken(req, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.redirect).toHaveBeenCalledWith('/login')
    expect(mockNext).not.toHaveBeenCalled()
  })
})
