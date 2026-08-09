import { create } from 'zustand'
import { User, UserRole } from '@/types'
import { MOCK_USERS } from '@/services/mockDataService'

interface AuthStore {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, role?: UserRole) => Promise<User>
  signup: (data: Partial<User>) => Promise<User>
  logout: () => void
  setUser: (user: User) => void
  updateUser: (data: Partial<User>) => void
  switchRole: (role: UserRole) => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: typeof window !== 'undefined' && localStorage.getItem('cardioai_user')
    ? JSON.parse(localStorage.getItem('cardioai_user') as string)
    : null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isLoading: false,

  login: async (email: string, role: UserRole = 'patient') => {
    set({ isLoading: true })
    // Find matching mock user or build user
    const matched = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase() || u.role === role)
    const userToSet: User = matched || {
      id: `user_${Date.now()}`,
      email,
      name: email.split('@')[0].toUpperCase(),
      age: 40,
      gender: 'male',
      height: 175,
      weight: 72,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('cardioai_user', JSON.stringify(userToSet))
      localStorage.setItem('token', `mock_token_${userToSet.id}`)
    }

    set({ user: userToSet, token: `mock_token_${userToSet.id}`, isLoading: false })
    return userToSet
  },

  signup: async (data: Partial<User>) => {
    set({ isLoading: true })
    const newUser: User = {
      id: `user_${Date.now()}`,
      email: data.email || 'user@cardioai.com',
      name: data.name || 'New User',
      age: Number(data.age) || 30,
      gender: data.gender || 'male',
      height: Number(data.height) || 170,
      weight: Number(data.weight) || 70,
      role: data.role || 'patient',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('cardioai_user', JSON.stringify(newUser))
      localStorage.setItem('token', `mock_token_${newUser.id}`)
    }

    set({ user: newUser, token: `mock_token_${newUser.id}`, isLoading: false })
    return newUser
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cardioai_user')
      localStorage.removeItem('token')
    }
    set({ user: null, token: null })
  },

  setUser: (user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cardioai_user', JSON.stringify(user))
    }
    set({ user })
  },

  updateUser: (data: Partial<User>) => {
    const currentUser = get().user
    if (currentUser) {
      const updated = { ...currentUser, ...data, updatedAt: new Date().toISOString() }
      if (typeof window !== 'undefined') {
        localStorage.setItem('cardioai_user', JSON.stringify(updated))
      }
      set({ user: updated })
    }
  },

  switchRole: (role: UserRole) => {
    const matched = MOCK_USERS.find((u) => u.role === role)
    if (matched) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cardioai_user', JSON.stringify(matched))
      }
      set({ user: matched })
    } else {
      const currentUser = get().user
      if (currentUser) {
        const updated = { ...currentUser, role }
        set({ user: updated })
      }
    }
  },
}))
