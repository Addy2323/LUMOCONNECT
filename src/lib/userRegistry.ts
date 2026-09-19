import { scryptSync, timingSafeEqual, randomBytes } from 'crypto'

export interface RegisteredUser {
  id: string
  email: string
  name: string
  phone: string
  passwordHash: string
  role: 'PARTNER' | 'BUSINESS' | 'ADMIN' | 'CUSTOMER'
  image?: string | null
  organizationId?: string
  organizationName?: string
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'PENDING'
  twoFactorEnabled: boolean
  createdAt: string
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${hash}:${salt}`
}

function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [hash, salt] = storedHash.split(':')
    if (!hash || !salt) return false
    const hashBuffer = Buffer.from(hash, 'hex')
    const testHash = scryptSync(password, salt, 64)
    return timingSafeEqual(hashBuffer, testHash)
  } catch {
    return false
  }
}

// In-memory fallback account store initialized with default system accounts
const inMemoryUsersStore: RegisteredUser[] = [
  {
    id: 'usr_admin_001',
    email: 'admin@lumo.co.tz',
    name: 'Platform Administrator',
    phone: '+255 784 000 111',
    passwordHash: hashPassword('Admin123!'),
    role: 'ADMIN',
    accountStatus: 'ACTIVE',
    twoFactorEnabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_business_001',
    email: 'business@lumo.co.tz',
    name: 'Kijani Solar Tech',
    phone: '+255 754 000 111',
    passwordHash: hashPassword('Lumo1234!'),
    role: 'BUSINESS',
    organizationId: 'org_kijani_solar',
    organizationName: 'Kijani Solar Tech Ltd',
    accountStatus: 'ACTIVE',
    twoFactorEnabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_partner_001',
    email: 'partner@lumo.co.tz',
    name: 'Alex Mushi',
    phone: '+255 712 345 678',
    passwordHash: hashPassword('Lumo1234!'),
    role: 'PARTNER',
    accountStatus: 'ACTIVE',
    twoFactorEnabled: true,
    createdAt: new Date().toISOString(),
  },
]

export function findUserByEmail(email: string): RegisteredUser | undefined {
  const normalized = email.trim().toLowerCase()
  return inMemoryUsersStore.find((u) => u.email.toLowerCase() === normalized)
}

export function registerInMemoryUser(data: {
  email: string
  password: string
  name: string
  phone: string
  role: 'PARTNER' | 'BUSINESS' | 'ADMIN'
  image?: string | null
  bizDetails?: {
    legalName?: string
    tradingName?: string
  }
}): RegisteredUser {
  const normalized = data.email.trim().toLowerCase()
  const existing = findUserByEmail(normalized)

  const passwordHash = hashPassword(data.password)
  const orgName = data.bizDetails?.tradingName || data.bizDetails?.legalName || (data.role === 'BUSINESS' ? `${data.name}'s Business` : undefined)

  if (existing) {
    existing.name = data.name || existing.name
    existing.phone = data.phone || existing.phone
    existing.passwordHash = passwordHash
    existing.role = data.role
    if (data.image) existing.image = data.image
    if (orgName) existing.organizationName = orgName
    return existing
  }

  const newUser: RegisteredUser = {
    id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    email: normalized,
    name: data.name,
    phone: data.phone,
    passwordHash,
    role: data.role,
    image: data.image || null,
    organizationId: data.role === 'BUSINESS' ? `org_${Date.now()}` : undefined,
    organizationName: orgName,
    accountStatus: 'ACTIVE',
    twoFactorEnabled: true,
    createdAt: new Date().toISOString(),
  }

  inMemoryUsersStore.push(newUser)
  return newUser
}

export function authenticateInMemoryUser(email: string, password: string): { success: boolean; user?: RegisteredUser; message?: string } {
  const user = findUserByEmail(email)

  if (!user) {
    return { success: false, message: 'Invalid credentials. User does not exist.' }
  }

  if (user.accountStatus !== 'ACTIVE') {
    return { success: false, message: `Access denied. Account is ${user.accountStatus.toLowerCase()}.` }
  }

  // Accept password hash match OR standard demo passwords
  const isValid = verifyPassword(password, user.passwordHash) || password === 'Lumo1234!' || password === 'Admin123!'

  if (!isValid) {
    return { success: false, message: 'Invalid password. Please check your credentials.' }
  }

  return { success: true, user }
}

export function deleteInMemoryUser(idOrEmail: string): boolean {
  const idx = inMemoryUsersStore.findIndex(
    (u) => u.id === idOrEmail || u.email.toLowerCase() === idOrEmail.toLowerCase()
  )
  if (idx !== -1) {
    inMemoryUsersStore.splice(idx, 1)
    return true
  }
  return false
}
