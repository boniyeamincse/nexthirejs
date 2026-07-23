import { DateTime } from 'luxon';
import { ExpertSlotService } from './expert-slot.service';

describe('ExpertSlotService', () => {
  let service: ExpertSlotService;
  const prisma = {
    expertAvailabilityProfile: { findUnique: jest.fn() },
    expertBooking: { findMany: jest.fn() },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-07-01T00:00:00.000Z'));
    prisma.expertBooking.findMany.mockResolvedValue([]);
    service = new ExpertSlotService(prisma as never);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function mockProfile(overrides: {
    timezone?: string;
    bufferBeforeMinutes?: number;
    bufferAfterMinutes?: number;
    minimumNoticeHours?: number;
    bookingWindowDays?: number;
    weekly?: { dayOfWeek: number; startLocalTime: string; endLocalTime: string }[];
    overrides?: {
      localDate: string;
      type: 'UNAVAILABLE' | 'CUSTOM_HOURS';
      windows?: { startLocalTime: string; endLocalTime: string }[];
    }[];
  }) {
    prisma.expertAvailabilityProfile.findUnique.mockResolvedValue({
      timezone: overrides.timezone ?? 'UTC',
      bufferBeforeMinutes: overrides.bufferBeforeMinutes ?? 0,
      bufferAfterMinutes: overrides.bufferAfterMinutes ?? 0,
      minimumNoticeHours: overrides.minimumNoticeHours ?? 0,
      bookingWindowDays: overrides.bookingWindowDays ?? 90,
      weekly: overrides.weekly ?? [],
      overrides: (overrides.overrides ?? []).map((o) => ({
        localDate: o.localDate,
        type: o.type,
        windows: o.windows ?? null,
      })),
    });
  }

  it('returns an empty preview when the expert has no availability profile', async () => {
    prisma.expertAvailabilityProfile.findUnique.mockResolvedValue(null);
    const result = await service.previewSlots('u1', {
      from: '2026-07-20',
      to: '2026-07-26',
      durationMinutes: 30,
    });
    expect(result).toEqual({ timezone: 'UTC', durationMinutes: 30, slots: [] });
  });

  it('generates back-to-back slots from a weekly window (UTC, 2026-07-20 is a Monday = dayOfWeek 0)', async () => {
    mockProfile({ weekly: [{ dayOfWeek: 0, startLocalTime: '09:00', endLocalTime: '10:00' }] });
    const result = await service.previewSlots('u1', {
      from: '2026-07-20',
      to: '2026-07-20',
      durationMinutes: 30,
    });
    expect(result.slots).toEqual([
      {
        startUtc: '2026-07-20T09:00:00.000Z',
        endUtc: '2026-07-20T09:30:00.000Z',
        localDate: '2026-07-20',
        startLocalTime: '09:00',
        endLocalTime: '09:30',
      },
      {
        startUtc: '2026-07-20T09:30:00.000Z',
        endUtc: '2026-07-20T10:00:00.000Z',
        localDate: '2026-07-20',
        startLocalTime: '09:30',
        endLocalTime: '10:00',
      },
    ]);
  });

  it('produces no slots on days without a matching weekly rule', async () => {
    mockProfile({ weekly: [{ dayOfWeek: 0, startLocalTime: '09:00', endLocalTime: '10:00' }] });
    const result = await service.previewSlots('u1', {
      from: '2026-07-21',
      to: '2026-07-21',
      durationMinutes: 30,
    });
    expect(result.slots).toEqual([]);
  });

  it('an UNAVAILABLE override blocks a date that otherwise has a weekly rule', async () => {
    mockProfile({
      weekly: [{ dayOfWeek: 0, startLocalTime: '09:00', endLocalTime: '10:00' }],
      overrides: [{ localDate: '2026-07-20', type: 'UNAVAILABLE' }],
    });
    const result = await service.previewSlots('u1', {
      from: '2026-07-20',
      to: '2026-07-20',
      durationMinutes: 30,
    });
    expect(result.slots).toEqual([]);
  });

  it('a CUSTOM_HOURS override replaces the day windows entirely', async () => {
    mockProfile({
      weekly: [{ dayOfWeek: 0, startLocalTime: '09:00', endLocalTime: '10:00' }],
      overrides: [
        {
          localDate: '2026-07-20',
          type: 'CUSTOM_HOURS',
          windows: [{ startLocalTime: '14:00', endLocalTime: '15:00' }],
        },
      ],
    });
    const result = await service.previewSlots('u1', {
      from: '2026-07-20',
      to: '2026-07-20',
      durationMinutes: 60,
    });
    expect(result.slots).toEqual([
      {
        startUtc: '2026-07-20T14:00:00.000Z',
        endUtc: '2026-07-20T15:00:00.000Z',
        localDate: '2026-07-20',
        startLocalTime: '14:00',
        endLocalTime: '15:00',
      },
    ]);
  });

  it('trims buffers from both ends of the window before generating slots', async () => {
    mockProfile({
      weekly: [{ dayOfWeek: 0, startLocalTime: '09:00', endLocalTime: '10:00' }],
      bufferBeforeMinutes: 15,
      bufferAfterMinutes: 15,
    });
    const result = await service.previewSlots('u1', {
      from: '2026-07-20',
      to: '2026-07-20',
      durationMinutes: 30,
    });
    // Effective window is 09:15-09:45 (30 min) -> exactly one 30-minute slot fits.
    expect(result.slots).toEqual([
      {
        startUtc: '2026-07-20T09:15:00.000Z',
        endUtc: '2026-07-20T09:45:00.000Z',
        localDate: '2026-07-20',
        startLocalTime: '09:15',
        endLocalTime: '09:45',
      },
    ]);
  });

  it('excludes slots that fall inside the minimum-notice window', async () => {
    // "Now" is faked to 2026-07-01T00:00:00Z; require 12h notice.
    mockProfile({
      weekly: [{ dayOfWeek: 2, startLocalTime: '09:00', endLocalTime: '10:00' }], // Wed = dayOfWeek 2
      minimumNoticeHours: 12,
    });
    // 2026-07-01 is itself a Wednesday, and 09:00 UTC that day is only 9h after "now" (< 12h notice).
    const result = await service.previewSlots('u1', {
      from: '2026-07-01',
      to: '2026-07-08',
      durationMinutes: 60,
    });
    expect(result.slots.some((s) => s.localDate === '2026-07-01')).toBe(false);
    expect(result.slots.some((s) => s.localDate === '2026-07-08')).toBe(true);
  });

  it('excludes dates beyond the booking window even if the requested range extends further', async () => {
    mockProfile({
      weekly: [{ dayOfWeek: 0, startLocalTime: '09:00', endLocalTime: '10:00' }],
      bookingWindowDays: 7,
    });
    const result = await service.previewSlots('u1', {
      from: '2026-07-01',
      to: '2026-08-01',
      durationMinutes: 30,
    });
    const latestDate = result.slots.reduce((max, s) => (s.localDate > max ? s.localDate : max), '');
    expect(latestDate <= '2026-07-08').toBe(true);
  });

  describe('DST correctness (America/New_York)', () => {
    beforeEach(() => {
      // These tests target fixed 2026 DST transition dates; anchor "now" well
      // before both so minimum-notice/booking-window filtering stays out of the way.
      jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    });

    it('applies the correct pre/post-transition UTC offset across the spring-forward date (2026-03-08, a Sunday = dayOfWeek 6)', async () => {
      mockProfile({
        timezone: 'America/New_York',
        weekly: [{ dayOfWeek: 6, startLocalTime: '01:00', endLocalTime: '04:00' }],
        bookingWindowDays: 365,
      });
      const result = await service.previewSlots('u1', {
        from: '2026-03-08',
        to: '2026-03-08',
        durationMinutes: 60,
      });

      // 01:00 local is still EST (UTC-5) -> 06:00Z. Everything from 03:00 local
      // onward (post-transition) is EDT (UTC-4).
      const first = result.slots[0]!;
      expect(first.startLocalTime).toBe('01:00');
      expect(first.startUtc).toBe('2026-03-08T06:00:00.000Z');

      const last = result.slots[result.slots.length - 1]!;

      // Every slot must be exactly 60 real minutes long, even across the gap.
      for (const slot of result.slots) {
        const durationMs =
          DateTime.fromISO(slot.endUtc).toMillis() - DateTime.fromISO(slot.startUtc).toMillis();
        expect(durationMs).toBe(60 * 60 * 1000);
      }

      // No two slots overlap.
      const sorted = [...result.slots].sort((a, b) => a.startUtc.localeCompare(b.startUtc));
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i]!.startUtc >= sorted[i - 1]!.endUtc).toBe(true);
      }

      // A naive fixed -05:00 offset would have put the last slot's start 1 hour
      // earlier than the real, DST-correct UTC instant.
      const naiveFixedOffsetStart = DateTime.fromISO('2026-03-08T03:00:00.000-05:00').toUTC();
      const dstCorrectStart = DateTime.fromISO(last.startUtc);
      expect(dstCorrectStart.toMillis()).not.toBe(naiveFixedOffsetStart.toMillis());
    });

    it('yields one extra real slot across the fall-back date, since the repeated hour is genuine additional availability (2026-11-01, a Sunday)', async () => {
      mockProfile({
        timezone: 'America/New_York',
        weekly: [{ dayOfWeek: 6, startLocalTime: '00:00', endLocalTime: '03:00' }],
        bookingWindowDays: 365,
      });
      const result = await service.previewSlots('u1', {
        from: '2026-11-01',
        to: '2026-11-01',
        durationMinutes: 60,
      });

      // A nominal 3-hour window (00:00-03:00) actually spans 4 real hours on
      // the day clocks fall back, because local "01:00-01:59" happens twice.
      // A naive engine that just divided the nominal window by duration would
      // wrongly produce 3 slots and silently drop an hour of real availability.
      expect(result.slots).toHaveLength(4);
      for (const slot of result.slots) {
        const durationMs =
          DateTime.fromISO(slot.endUtc).toMillis() - DateTime.fromISO(slot.startUtc).toMillis();
        expect(durationMs).toBe(60 * 60 * 1000);
      }
      // No two slots overlap or collide despite 01:00-02:00 local occurring twice in real time.
      const starts = result.slots.map((s) => s.startUtc);
      expect(new Set(starts).size).toBe(starts.length);
      expect(starts).toEqual([
        '2026-11-01T04:00:00.000Z',
        '2026-11-01T05:00:00.000Z',
        '2026-11-01T06:00:00.000Z',
        '2026-11-01T07:00:00.000Z',
      ]);
    });

    it('a fixed-offset zone (America/Phoenix, no DST) keeps the same UTC offset across both US transition dates', async () => {
      mockProfile({
        timezone: 'America/Phoenix',
        weekly: [
          { dayOfWeek: 6, startLocalTime: '01:00', endLocalTime: '02:00' }, // Sunday
        ],
        bookingWindowDays: 365,
      });

      const spring = await service.previewSlots('u1', {
        from: '2026-03-08',
        to: '2026-03-08',
        durationMinutes: 60,
      });
      const fall = await service.previewSlots('u1', {
        from: '2026-11-01',
        to: '2026-11-01',
        durationMinutes: 60,
      });

      // Phoenix is fixed UTC-7 year-round: 01:00 local -> 08:00Z on both dates.
      expect(spring.slots[0]!.startUtc).toBe('2026-03-08T08:00:00.000Z');
      expect(fall.slots[0]!.startUtc).toBe('2026-11-01T08:00:00.000Z');
    });
  });

  describe('booking conflict exclusion (NH-M14)', () => {
    it('excludes a slot that overlaps an active (HELD/CONFIRMED) ExpertBooking', async () => {
      mockProfile({ weekly: [{ dayOfWeek: 0, startLocalTime: '09:00', endLocalTime: '10:00' }] });
      prisma.expertBooking.findMany.mockResolvedValue([
        {
          slotStartUtc: new Date('2026-07-20T09:00:00.000Z'),
          slotEndUtc: new Date('2026-07-20T09:30:00.000Z'),
        },
      ]);
      const result = await service.previewSlots('u1', {
        from: '2026-07-20',
        to: '2026-07-20',
        durationMinutes: 30,
      });
      expect(result.slots).toEqual([
        {
          startUtc: '2026-07-20T09:30:00.000Z',
          endUtc: '2026-07-20T10:00:00.000Z',
          localDate: '2026-07-20',
          startLocalTime: '09:30',
          endLocalTime: '10:00',
        },
      ]);
    });

    it('only queries bookings for this expert, filtered to HELD/CONFIRMED', async () => {
      mockProfile({ weekly: [{ dayOfWeek: 0, startLocalTime: '09:00', endLocalTime: '10:00' }] });
      await service.previewSlots('u1', {
        from: '2026-07-20',
        to: '2026-07-20',
        durationMinutes: 30,
      });
      expect(prisma.expertBooking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            expertUserId: 'u1',
            status: { in: ['HELD', 'CONFIRMED'] },
          }),
        }),
      );
    });

    it('does not exclude a slot when no booking overlaps it', async () => {
      mockProfile({ weekly: [{ dayOfWeek: 0, startLocalTime: '09:00', endLocalTime: '10:00' }] });
      prisma.expertBooking.findMany.mockResolvedValue([
        {
          slotStartUtc: new Date('2026-07-21T09:00:00.000Z'),
          slotEndUtc: new Date('2026-07-21T09:30:00.000Z'),
        },
      ]);
      const result = await service.previewSlots('u1', {
        from: '2026-07-20',
        to: '2026-07-20',
        durationMinutes: 30,
      });
      expect(result.slots).toHaveLength(2);
    });
  });
});
