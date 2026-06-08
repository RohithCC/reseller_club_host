import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("✅ MongoDB Atlas Connected");

    mongoose.connection.on("error", (err) => {
      console.log("❌ DB Error:", err.message);
    });

  } catch (error) {
    console.log("❌ Connection Failed:", error.message);
    console.log("⚠️  Server will continue without database. Only non-DB endpoints will work.");
  }
};

export default connectDB;