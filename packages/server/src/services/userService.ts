import fs from 'fs/promises'
import path from 'path'
import argon2 from 'argon2'

const USERS_FILE = path.join(__dirname, '../../../users.json')

interface User {
  username: string
  passwordHash: string
}

export async function loadUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

export async function saveUsers(users: User[]): Promise<void> {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8')
}

export async function registerUser(username: string, password: string) {
  const users = await loadUsers()
  if (users.find(u => u.username === username)) {
    throw new Error('User already exists')
  }
  const passwordHash = await argon2.hash(password)
  users.push({ username, passwordHash })
  await saveUsers(users)
}

export async function authenticateUser(username: string, password: string) {
  const users = await loadUsers()
  const user = users.find(u => u.username === username)
  if (!user) throw new Error('User not found')
  const valid = await argon2.verify(user.passwordHash, password)
  if (!valid) throw new Error('Invalid password')
  return user
}
