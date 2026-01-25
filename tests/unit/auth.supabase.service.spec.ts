import { authService } from '../../src/services/auth.supabase.service'

describe('SupabaseAuthService mapping', () => {
  test('mapDatabaseUserToUser produces expected User object', () => {
    const dbUser: any = {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'foo@example.com',
      is_premium: true,
      available_money: '123.45',
      created_at: new Date().toISOString(),
    }

    // Access private method for testing via any cast
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapper = (authService as any).mapDatabaseUserToUser as (arg: any) => any
    const result = mapper(dbUser)

    expect(result).toBeDefined()
    expect(result.id).toBe(dbUser.id)
    expect(result.email).toBe(dbUser.email)
    expect(result.isPremium).toBe(true)
    expect(result.availableMoney).toBe(Number(dbUser.available_money))
    expect(result.createdAt).toBeInstanceOf(Date)
  })
})
