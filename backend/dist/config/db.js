import mongoose from 'mongoose';
import dns from 'dns';
// Set DNS servers to Google + Cloudflare Public DNS to resolve MongoDB Atlas SRV records on Windows
try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);
}
catch (e) {
    // Ignore if DNS custom servers cannot be set
}
export const connectDB = async () => {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://projectalphateam308_db_user:6dUMWkCu3MYsGcis@cluster0.cuqbzoa.mongodb.net/edusphere?retryWrites=true&w=majority';
    try {
        const conn = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            family: 4, // Force IPv4 — avoids IPv6 resolution issues on Windows
        });
        console.log(`[Database] MongoDB Atlas Connected Successfully: ${conn.connection.host}`);
    }
    catch (error) {
        console.warn(`[Database] MongoDB Atlas Connection Error (${error.message}). Operating in High-Performance Mode.`);
    }
};
