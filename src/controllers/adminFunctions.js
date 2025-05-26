'use strict'

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function adminLogin (req, res) {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const adminEmail = 'admin@example.com'
    const adminPassword = await bcrypt.hash('admin', 10)

    if (email !== adminEmail) {
      return res.status(401).json({ message: 'This is a dummy app, but the admin credentials are admin@example.com and admin' })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, adminPassword)
    if (!isValidPassword) {
      return res.status(401).json({ message: 'This is a dummy app, but the admin credentials are admin@example.com and admin' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    )

    // Send success response with token
    res.json({
      message: 'Login successful',
      token,
      redirect: '/admin'
    })
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

module.exports = {
  adminLogin
}
