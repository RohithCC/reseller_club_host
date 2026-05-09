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
    process.exit(1);
  }
};

export default connectDB;