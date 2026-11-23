import Router from "express";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { desc } from "drizzle-orm";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "../validation/matches.js";
import { getMatchStatus } from "../utils/match-status.js";
import { broadcastMatchCreated } from "../ws/server.js";

const router = Router();

router.get("/", async (req, res) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Invalid query", details: parsed.error.issues });
  }

  const limit = parsed.data.limit ?? 50;

  try {
    const results = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(limit);
    res.json({ data: results });
  } catch (e) {
    res
      .status(500)
      .json({ error: "Failed to fetch matches", details: JSON.stringify(e) });
  }
});

router.post("/", async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Invalid details", details: parsed.error.issues });
  }

  const { startTime, endTime, homeScore, awayScore } = parsed.data;

  try {
    const [event] = await db
      .insert(matches)
      .values({
        ...parsed.data,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: getMatchStatus(startTime, endTime),
      })
      .returning();

    console.log("POST /matches inserted match:", event.id);
    broadcastMatchCreated(event);

    res
      .status(201)
      .json({ message: "Match created successfully", data: event });
  } catch (e) {
    res
      .status(500)
      .json({ error: "Failed to create match", details: JSON.stringify(e) });
  }
});

export default router;
