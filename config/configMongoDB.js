import mongoose from "mongoose";

const config = {
    mongoDB:{
        URL:"mongodb://dbUser:dbUserPassword@cluster0.dwet05v.mongodb.net/?retryWrites=true",
        options:{
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    }
}

export const connectMongoDB = async () => {
  try {
    await mongoose.connect("mongodb://dbUser:dbUserPassword@cluster0.dwet05v.mongodb.net/?retryWrites=true");
    console.log("Connected Mongo DB");
  } catch (error) {
    console.log("Error en la conexión a mongoDB", error);
  }
};