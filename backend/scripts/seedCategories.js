import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});
const Category = mongoose.model("Category", categorySchema);

const CATEGORIES = [
  "Droit",
  "Sciences économiques et de gestion",
  "Philosophie",
  "Littérature ivoirienne",
  "Littérature africaine",
  "Communication",
  "Développement personnel",
  "Anglais",
  "Rédaction",
  "Dictionnaires",
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  for (const name of CATEGORIES) {
    const exists = await Category.findOne({ name });
    if (!exists) {
      await Category.create({ name });
      console.log(`  + ${name}`);
    } else {
      console.log(`  = ${name} (existe déjà)`);
    }
  }

  console.log("Done!");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
