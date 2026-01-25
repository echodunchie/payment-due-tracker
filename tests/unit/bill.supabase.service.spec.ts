import { billService } from '../../src/services/bill.supabase.service'

describe('SupabaseBillService mapping', () => {
  test('mapDatabaseBillToBill parses YYYY-MM-DD into local Date', () => {
    const dbBill: any = {
      id: '22222222-2222-2222-2222-222222222222',
      user_id: '11111111-1111-1111-1111-111111111111',
      name: 'Test Bill',
      amount: 100.5,
      due_date: '2026-01-31',
      notification_frequency: '1_day',
      reminder_enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Access private method for testing via any cast
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapper = (billService as any).mapDatabaseBillToBill as (arg: any) => any
    const result = mapper(dbBill)

    expect(result).toBeDefined()
    expect(result.id).toBe(dbBill.id)
    expect(result.name).toBe(dbBill.name)
    expect(result.amount).toBe(dbBill.amount)
    expect(result.dueDate).toBeInstanceOf(Date)

    const due = result.dueDate as Date
    expect(due.getFullYear()).toBe(2026)
    expect(due.getMonth()).toBe(0) // January is month 0
    expect(due.getDate()).toBe(31)
  })
})
