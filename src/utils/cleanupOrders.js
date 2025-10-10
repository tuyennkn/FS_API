/**
 * Cleanup Script - Remove Fake Orders
 * Use this to clean up generated fake orders if needed
 * Run: node src/utils/cleanupOrders.js
 */

import mongoose from 'mongoose';
import Order from '../models/Order.js';

async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function cleanupOrders() {
  try {
    const count = await Order.countDocuments();
    console.log(`📊 Found ${count} orders in database`);
    
    if (count === 0) {
      console.log('ℹ️ No orders to cleanup');
      return;
    }

    console.log('🗑️ Are you sure you want to delete ALL orders?');
    console.log('⚠️ This action cannot be undone!');
    console.log('💡 If you only want to delete fake orders, modify this script');
    
    // Uncomment the next line to actually delete (safety measure)
    // const result = await Order.deleteMany({});
    
    console.log('🔒 Delete command is commented out for safety');
    console.log('🔧 Edit the script and uncomment the delete line to proceed');
    
    // If you uncommented the delete line:
    // console.log(`✅ Deleted ${result.deletedCount} orders`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await cleanupOrders();
  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
}

main();