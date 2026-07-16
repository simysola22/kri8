import { db, ideasTable } from "@workspace/db";

export async function testDb() {
  const result = await db.select().from(ideasTable);
  console.log(result);
}
