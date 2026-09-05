const mongoose = require("mongoose");

const MONGO_URL = process.env.MONGO_URL

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URL);

    console.log(
      "[MONGODB] Connected successfully"
    );
  } catch (error) {
    console.error(
      "[MONGODB] Connection failed:",
      error.message
    );

    process.exit(1);
  }
}

module.exports = {
  connectDB,
};