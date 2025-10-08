import mongoose from "mongoose";

const connectionDB = async () => {
    mongoose.connect(process.env.DB_URL as unknown as string).then(() => {
        console.log(`Connected successfully to DB ${process.env.DB_URL}`);
    }).catch((error) => {
        console.log(`Failed to connect to DB`, error);
    })
}

export default connectionDB;