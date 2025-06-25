import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

export interface GameOwnerUser {
  id: string
  email: string
  passwordHash: string
  name: string
  country: string
  discordId?: string
  isActive: boolean
  emailVerified: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface UserSession {
  id: string
  userId: string
  sessionToken: string
  expiresAt: string
  createdAt: string
}

export interface AuthResult {
  success: boolean
  user?: GameOwnerUser
  sessionToken?: string
  error?: string
}

class JSONAuthService {
  private usersFile = path.join(process.cwd(), 'data/game-owner-users.json')
  private sessionsFile = path.join(process.cwd(), 'data/game-owner-sessions.json')

  constructor() {
    this.ensureDataFiles()
  }

  private ensureDataFiles() {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // Initialize users file
    if (!fs.existsSync(this.usersFile)) {
      fs.writeFileSync(this.usersFile, JSON.stringify({ users: [] }, null, 2))
    }

    // Initialize sessions file
    if (!fs.existsSync(this.sessionsFile)) {
      fs.writeFileSync(this.sessionsFile, JSON.stringify({ sessions: [] }, null, 2))
    }
  }

  private loadUsers(): GameOwnerUser[] {
    try {
      const data = JSON.parse(fs.readFileSync(this.usersFile, 'utf8'))
      return data.users || []
    } catch (error) {
      console.error('Error loading users:', error)
      return []
    }
  }

  private saveUsers(users: GameOwnerUser[]) {
    fs.writeFileSync(this.usersFile, JSON.stringify({ users }, null, 2))
  }

  private loadSessions(): UserSession[] {
    try {
      const data = JSON.parse(fs.readFileSync(this.sessionsFile, 'utf8'))
      return data.sessions || []
    } catch (error) {
      console.error('Error loading sessions:', error)
      return []
    }
  }

  private saveSessions(sessions: UserSession[]) {
    fs.writeFileSync(this.sessionsFile, JSON.stringify({ sessions }, null, 2))
  }

  // Register a new user
  async registerUser(
    email: string,
    password: string,
    name: string,
    country: string,
    discordId?: string
  ): Promise<AuthResult> {
    try {
      const users = this.loadUsers()
      
      // Check if user already exists
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, error: 'User already exists' }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10)

      // Create new user
      const newUser: GameOwnerUser = {
        id: uuidv4(),
        email: email.toLowerCase(),
        passwordHash,
        name,
        country,
        discordId,
        isActive: true,
        emailVerified: false, // In a real system, send verification email
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      users.push(newUser)
      this.saveUsers(users)

      // Create session
      const sessionToken = await this.createSession(newUser.id)

      return {
        success: true,
        user: newUser,
        sessionToken
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Registration failed' }
    }
  }

  // Login user
  async loginUser(email: string, password: string): Promise<AuthResult> {
    try {
      const users = this.loadUsers()
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      if (!user.isActive) {
        return { success: false, error: 'Account is deactivated' }
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.passwordHash)
      if (!passwordMatch) {
        return { success: false, error: 'Invalid password' }
      }

      // Update last login
      user.lastLogin = new Date().toISOString()
      user.updatedAt = new Date().toISOString()
      this.saveUsers(users)

      // Create session
      const sessionToken = await this.createSession(user.id)

      return {
        success: true,
        user,
        sessionToken
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Login failed' }
    }
  }

  // Create session
  private async createSession(userId: string): Promise<string> {
    const sessions = this.loadSessions()
    
    // Clean up expired sessions
    const now = new Date()
    const activeSessions = sessions.filter(s => new Date(s.expiresAt) > now)

    // Create new session
    const sessionToken = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    const newSession: UserSession = {
      id: uuidv4(),
      userId,
      sessionToken,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    }

    activeSessions.push(newSession)
    this.saveSessions(activeSessions)

    return sessionToken
  }

  // Validate session
  async validateSession(sessionToken: string): Promise<GameOwnerUser | null> {
    try {
      const sessions = this.loadSessions()
      const session = sessions.find(s => s.sessionToken === sessionToken)

      if (!session) {
        return null
      }

      // Check if session is expired
      if (new Date(session.expiresAt) <= new Date()) {
        // Remove expired session
        const updatedSessions = sessions.filter(s => s.sessionToken !== sessionToken)
        this.saveSessions(updatedSessions)
        return null
      }

      // Get user
      const users = this.loadUsers()
      const user = users.find(u => u.id === session.userId)

      return user || null
    } catch (error) {
      console.error('Session validation error:', error)
      return null
    }
  }

  // Logout (remove session)
  async logout(sessionToken: string): Promise<boolean> {
    try {
      const sessions = this.loadSessions()
      const updatedSessions = sessions.filter(s => s.sessionToken !== sessionToken)
      this.saveSessions(updatedSessions)
      return true
    } catch (error) {
      console.error('Logout error:', error)
      return false
    }
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<GameOwnerUser | null> {
    const users = this.loadUsers()
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null
  }

  // Update user
  async updateUser(userId: string, updates: Partial<GameOwnerUser>): Promise<GameOwnerUser | null> {
    try {
      const users = this.loadUsers()
      const userIndex = users.findIndex(u => u.id === userId)

      if (userIndex === -1) {
        return null
      }

      users[userIndex] = {
        ...users[userIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      }

      this.saveUsers(users)
      return users[userIndex]
    } catch (error) {
      console.error('Update user error:', error)
      return null
    }
  }
}

export const jsonAuthService = new JSONAuthService() 