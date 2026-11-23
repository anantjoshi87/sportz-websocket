import { z } from "zod";

export const MATCH_STATUS = Object.freeze({
  SCHEDULED: "scheduled",
  LIVE: "live",
  FINISHED: "finished",
});

const isoDateTimeSchema = z
  .string()
  .refine(
    (value) => z.iso.datetime({ offset: true }).safeParse(value).success,
    { message: "Must be a valid ISO date-time string." },
  );

export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const matchidParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createMatchSchema = z
  .object({
    sport: z.string().trim().min(1),
    homeTeam: z.string().trim().min(1),
    awayTeam: z.string().trim().min(1),
    startTime: isoDateTimeSchema,
    endTime: isoDateTimeSchema,
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional(),
  })
  .superRefine((match, ctx) => {
    const startTime = Date.parse(match.startTime);
    const endTime = Date.parse(match.endTime);

    if (
      Number.isFinite(startTime) &&
      Number.isFinite(endTime) &&
      endTime <= startTime
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "endTime must be after startTime.",
      });
    }
  });

export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});
