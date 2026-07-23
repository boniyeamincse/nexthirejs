import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { PrismaService } from '../../../database/prisma.service';
import { EXPERT_OFFERING_LIMITS } from '@nexthire/constants';
import type { ExpertAvailabilitySlotPreviewResult } from '@nexthire/types';

interface LocalWindow {
  startMinutes: number;
  endMinutes: number;
}

interface OverrideWindow {
  startLocalTime: string;
  endLocalTime: string;
}

function parseTimeToMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
}

function mapOverrideWindows(windows: unknown): LocalWindow[] {
  if (!Array.isArray(windows)) return [];
  return (windows as OverrideWindow[]).map((w) => ({
    startMinutes: parseTimeToMinutes(w.startLocalTime),
    endMinutes: parseTimeToMinutes(w.endLocalTime),
  }));
}

/**
 * Computes concrete bookable slot instances from an expert's recurring weekly
 * windows and per-date overrides, excluding any slot that overlaps an active
 * (HELD/CONFIRMED) `ExpertBooking` for that expert (NH-M14). The legacy
 * `trainers` domain's `Booking` table is unrelated and still unreconciled —
 * see the trainers/experts reconciliation flagged since NH-M00.
 *
 * DST correctness: each window's start/end wall-clock time is resolved once
 * per calendar date via `DateTime.fromObject({ ...date, hour, minute }, {
 * zone })`, never by adding a fixed UTC offset — Luxon resolves the correct
 * UTC instant for that exact date+zone. Slots within a window are then
 * chained forward via real-elapsed-time `.plus()` from that anchor rather
 * than re-deriving each slot independently from raw minutes-of-day; the
 * latter would make two different nominal minute values collapse onto the
 * same real instant on a spring-forward day (a nonexistent local time and
 * the valid time right after it both resolve to the same post-gap instant),
 * producing duplicate slots. Chaining also correctly yields one extra slot
 * on a fall-back day, since the repeated hour is genuine additional real
 * availability.
 */
@Injectable()
export class ExpertSlotService {
  constructor(private readonly prisma: PrismaService) {}

  async previewSlots(
    userId: string,
    params: { from: string; to: string; durationMinutes: number },
  ): Promise<ExpertAvailabilitySlotPreviewResult> {
    const profile = await this.prisma.expertAvailabilityProfile.findUnique({
      where: { userId },
      include: { weekly: true, overrides: true },
    });

    if (!profile) {
      return { timezone: 'UTC', durationMinutes: params.durationMinutes, slots: [] };
    }

    const zone = profile.timezone;
    const now = DateTime.utc();
    const earliestBookable = now.plus({ hours: profile.minimumNoticeHours });
    const bookableUntil = now.plus({ days: profile.bookingWindowDays });

    const requestedFrom = DateTime.fromISO(params.from, { zone: 'utc' }).startOf('day');
    const requestedTo = DateTime.fromISO(params.to, { zone: 'utc' }).startOf('day');
    if (!requestedFrom.isValid || !requestedTo.isValid) {
      return { timezone: zone, durationMinutes: params.durationMinutes, slots: [] };
    }

    const rangeStartUtc = DateTime.max(requestedFrom, now.startOf('day'));
    const rangeEndUtc = DateTime.min(requestedTo, bookableUntil.startOf('day'));
    if (rangeEndUtc < rangeStartUtc) {
      return { timezone: zone, durationMinutes: params.durationMinutes, slots: [] };
    }

    const weeklyByDay = new Map<number, LocalWindow[]>();
    for (const w of profile.weekly) {
      const list = weeklyByDay.get(w.dayOfWeek) ?? [];
      list.push({
        startMinutes: parseTimeToMinutes(w.startLocalTime),
        endMinutes: parseTimeToMinutes(w.endLocalTime),
      });
      weeklyByDay.set(w.dayOfWeek, list);
    }

    const overridesByDate = new Map(profile.overrides.map((o) => [o.localDate, o]));

    // Slots overlapping an active (HELD/CONFIRMED) ExpertBooking are excluded
    // below. Widened to the full [now, bookableUntil] range rather than just
    // the requested from/to so the result is correct regardless of how the
    // caller clamped the request.
    const bookedRows = await this.prisma.expertBooking.findMany({
      where: {
        expertUserId: userId,
        status: { in: ['HELD', 'CONFIRMED'] },
        slotStartUtc: { lt: bookableUntil.toJSDate() },
        slotEndUtc: { gt: now.toJSDate() },
      },
      select: { slotStartUtc: true, slotEndUtc: true },
    });
    const bookedIntervals = bookedRows.map((b) => ({
      startMs: b.slotStartUtc.getTime(),
      endMs: b.slotEndUtc.getTime(),
    }));

    const slots: ExpertAvailabilitySlotPreviewResult['slots'] = [];

    let cursor = rangeStartUtc.setZone(zone, { keepLocalTime: true }).startOf('day');
    const lastDay = rangeEndUtc.setZone(zone, { keepLocalTime: true }).startOf('day');

    while (cursor <= lastDay) {
      const localDate = cursor.toISODate();
      if (!localDate) {
        cursor = cursor.plus({ days: 1 });
        continue;
      }

      const override = overridesByDate.get(localDate);
      let windows: LocalWindow[];
      if (override?.type === 'UNAVAILABLE') {
        windows = [];
      } else if (override?.type === 'CUSTOM_HOURS') {
        windows = mapOverrideWindows(override.windows);
      } else {
        // Luxon weekday: 1=Monday..7=Sunday. This codebase's dayOfWeek: 0=Monday..6=Sunday.
        const dayOfWeek = cursor.weekday - 1;
        windows = weeklyByDay.get(dayOfWeek) ?? [];
      }

      const [year, month, day] = localDate.split('-').map(Number);

      for (const window of windows) {
        const trimmedStart = window.startMinutes + profile.bufferBeforeMinutes;
        const trimmedEnd = window.endMinutes - profile.bufferAfterMinutes;
        if (trimmedEnd <= trimmedStart) continue;

        const windowStartLocal = DateTime.fromObject(
          { year, month, day, hour: Math.floor(trimmedStart / 60), minute: trimmedStart % 60 },
          { zone },
        );
        const windowEndLocal = DateTime.fromObject(
          { year, month, day, hour: Math.floor(trimmedEnd / 60), minute: trimmedEnd % 60 },
          { zone },
        );
        if (!windowStartLocal.isValid || !windowEndLocal.isValid) continue;

        // Chain each slot's start from the previous slot's real (DST-correct)
        // end instant, rather than independently re-deriving every slot's
        // wall-clock start from raw minutes-of-day. Re-deriving each slot from
        // `{ hour, minute }` would make two different nominal minute values
        // collapse onto the same real instant on a spring-forward day (both
        // resolve into the post-gap offset), producing duplicate slots at an
        // identical UTC instant. Chaining via `.plus()` from a known-valid
        // instant always advances by the real elapsed duration, so it also
        // correctly yields one extra slot on a fall-back day (the repeated
        // hour is genuine additional real availability).
        let cursorLocal = windowStartLocal;
        while (true) {
          const slotEndLocal = cursorLocal.plus({ minutes: params.durationMinutes });
          if (slotEndLocal > windowEndLocal) break;

          const startMs = cursorLocal.toUTC().toMillis();
          const endMs = slotEndLocal.toUTC().toMillis();
          const isBooked = bookedIntervals.some((b) => startMs < b.endMs && b.startMs < endMs);

          if (cursorLocal >= earliestBookable && cursorLocal <= bookableUntil && !isBooked) {
            slots.push({
              startUtc: cursorLocal.toUTC().toISO()!,
              endUtc: slotEndLocal.toUTC().toISO()!,
              localDate,
              startLocalTime: cursorLocal.toFormat('HH:mm'),
              endLocalTime: slotEndLocal.toFormat('HH:mm'),
            });
          }
          cursorLocal = slotEndLocal;
        }
      }

      cursor = cursor.plus({ days: 1 });
    }

    return { timezone: zone, durationMinutes: params.durationMinutes, slots };
  }

  static readonly MAX_PREVIEW_RANGE_DAYS = EXPERT_OFFERING_LIMITS.SLOT_PREVIEW_MAX_RANGE_DAYS;
}
