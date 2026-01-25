describe('SupabaseBillService.ensureUserProfile', () => {
  test('creates profile when missing using upsert', async () => {
    jest.resetModules()

    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null })
    const mockUpsert = jest.fn().mockResolvedValue({ error: null })

    const usersChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: mockMaybeSingle,
      upsert: mockUpsert,
    }

    const supabaseMock = {
      from: (_table: string) => usersChain,
      auth: {},
    }

    jest.doMock('../../src/lib/supabase', () => ({ supabase: supabaseMock }))

    const { billService } = require('../../src/services/bill.supabase.service')

    const userId = 'u-1'
    const email = 'tester@example.com'

    // Call private method
    await (billService as any).ensureUserProfile(userId, email)

    expect(usersChain.select).toHaveBeenCalled()
    expect(usersChain.eq).toHaveBeenCalledWith('id', userId)
    expect(mockUpsert).toHaveBeenCalledWith({ id: userId, email: email, is_premium: false }, { onConflict: 'id' })
  })
})
