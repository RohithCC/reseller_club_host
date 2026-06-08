// ─────────────────────────────────────────────────────────────────────
//  backend/scripts/clear-blogs.js
//  Run with:  node scripts/clear-blogs.js
//  Deletes ALL blog posts from the database.
// ─────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";
import blogModel from "../models/blogModel.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/ecom";

async function run() {
  console.log("→ Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected\n");

  const result = await blogModel.deleteMany({});
  console.log(`🗑️  Deleted ${result.deletedCount} blog post(s)\n`);

  await mongoose.disconnect();
  console.log("✅ Done. All blog posts removed.");
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Failed:", e.message);
  process.exit(1);
});
