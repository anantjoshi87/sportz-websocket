import express from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import {
  createCommentarySchema,
  listCommentaryQuerySchema,
} from "../validation/commentary.js";
import { matchidParamSchema } from "../validation/matches.js";

const router = express.Router({ mergeParams: true });

router.get("/", async (req, res) => {
  console.log(req);
  const parsedParams = matchidParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res
      .status(400)
      .json({ error: "Invalid match ID", details: parsedParams.error.issues });
  }

  const parsedQuery = listCommentaryQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    return res.status(400).json({
      error: "Invalid query",
      details: parsedQuery.error.issues,
    });
  }

  const limit = Math.min(parsedQuery.data.limit ?? 50, 50);

  try {
    const results = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, parsedParams.data.id))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    return res.status(200).json({ data: results });
  } catch (error) {
    console.error("Failed to fetch commentary:", error);
    return res.status(500).json({ error: "Failed to fetch commentary" });
  }
});

router.post("/", async (req, res) => {
  const parsedParams = matchidParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res
      .status(400)
      .json({ error: "Invalid match ID", details: parsedParams.error.issues });
  }

  const parsedBody = createCommentarySchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({
      error: "Invalid commentary",
      details: parsedBody.error.issues,
    });
  }

  try {
    const [createdCommentary] = await db
      .insert(commentary)
      .values({
        ...parsedBody.data,
        matchId: parsedParams.data.id,
      })
      .returning();

    return res.status(201).json({ data: createdCommentary });
  } catch (error) {
    console.error("Failed to create commentary:", error);
    return res.status(500).json({ error: "Failed to create commentary" });
  }
});

export default router;
