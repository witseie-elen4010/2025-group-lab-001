/* eslint-env jest */
/* eslint-disable no-unused-vars */
jest.setTimeout(10000)

// Mock the database connection
jest.mock('@config/db', () => ({
  getPool: jest.fn().mockResolvedValue({
    request: jest.fn().mockReturnValue({
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [] })
    })
  }),
  sql: {
    NVarChar: jest.fn(),
    DateTime2: jest.fn(),
    MAX: 'max'
  }
}))

beforeAll(async () => {
  // Add any setup needed before all tests
})

afterAll(async () => {
  // Cleanup after all tests
  await new Promise(resolve => setTimeout(resolve, 500)) // Allow async operations to complete
})
