describe('SupabaseAuthService reconciliation during login', () => {
  test('reconciles profile found by email and transfers bills', async () => {
    jest.resetModules()

    const oldId = 'old-id-123'
    const newId = 'new-id-456'
    const email = 'reconcile@example.com'

    // users select maybeSingle called twice: first for id -> null, then for email -> byEmail
    const mockUsersMaybeSingle = jest.fn()
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { id: oldId, email, is_premium: false, available_money: 5.0 }, error: null })

    const upsertResult = { data: { id: newId, email, is_premium: false, available_money: 5.0 }, error: null }
    const mockUpsert = jest.fn().mockReturnValue({
      select: () => ({
        maybeSingle: jest.fn().mockResolvedValue(upsertResult)
      })
    })

    // bills.update(...).eq(...) -> resolved { error: null }
    const mockBillsUpdateEq = jest.fn().mockResolvedValue({ error: null })
    const mockBillsUpdate = jest.fn().mockImplementation((_updateData: any) => ({ eq: mockBillsUpdateEq }))

    const usersChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: mockUsersMaybeSingle,
      upsert: mockUpsert,
      insert: jest.fn(),
    }

    const billsChain = {
      update: mockBillsUpdate,
    }

    const mockSignIn = jest.fn().mockResolvedValue({ data: { user: { id: newId } }, error: null })

    const supabaseMock = {
      from: (table: string) => {
        if (table === 'users') return usersChain
        if (table === 'bills') return billsChain
        return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn() }
      },
      auth: {
        signInWithPassword: mockSignIn,
      },
    }

    jest.doMock('../../src/lib/supabase', () => ({ supabase: supabaseMock }))

    const { authService } = require('../../src/services/auth.supabase.service')

    const result = await authService.login({ email, password: 'p' })

    expect(mockSignIn).toHaveBeenCalled()
    expect(mockUsersMaybeSingle).toHaveBeenCalled()
    expect(mockUpsert).toHaveBeenCalled()
    expect(mockBillsUpdate).toHaveBeenCalledWith({ user_id: newId })
    expect(mockBillsUpdateEq).toHaveBeenCalledWith('user_id', oldId)
    expect(result).toBeDefined()
    expect(result.id).toBe(newId)
  })
})
