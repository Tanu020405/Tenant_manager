/**
 * wipeDb.js
 * Drops every collection in the fs_project database.
 * Run with: node scripts/wipeDb.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fs_project";

async function wipe() {
  await mongoose.connect(uri);
  console.log("Connected to:", uri);

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  if (collections.length === 0) {
    console.log("Database is already empty. Nothing to wipe.");
  } else {
    for (const col of collections) {
      await db.dropCollection(col.name);
      console.log(`  ✓ Dropped: ${col.name}`);
    }
    console.log("\nAll collections dropped. Database is clean.");
  }

  await mongoose.disconnect();
}

wipe().catch((err) => {
  console.error("Wipe failed:", err.message);
  process.exit(1);
});
