import { createAuthClient } from 'better-auth/react'

// No baseURL = relative URLs. Client always requests from the same origin,
// which eliminates CORS issues on both localhost and Vercel.
export const authClient = createAuthClient()

export const { signIn, signUp, signOut, useSession } = authClient
