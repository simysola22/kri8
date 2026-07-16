import { db } from "../db/db";
import { ideas } from "../db/schema";

export async function testDb() {
  const result = await db.select().from(ideas);

  console.log(result);
}
