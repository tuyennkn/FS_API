/**
 * Enhanced Fake Data Generator for Admin Panel
 * Creates fake users and orders for testing statistics
 * All users have password: 123456
 * Run from FS_API directory: node src/utils/generateFakeData.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Order from '../models/Order.js';
import Book from '../models/Book.js';
import User from '../models/User.js';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database_name';

// Configuration
const TOTAL_USERS = 50;
const TOTAL_ORDERS = 150;
const DEFAULT_PASSWORD = '123456';
const ORDER_STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];
const PAYMENT_TYPES = ['cash', 'card', 'online'];

// Vietnamese data
const VIETNAMESE_CITIES = [
  'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 
  'Nha Trang', 'Hạ Long', 'Vũng Tàu', 'Đà Lạt', 'Huế',
  'Quy Nhon', 'Biên Hòa', 'Thủ Đức', 'Long Xuyên', 'Mỹ Tho',
  'Bắc Ninh', 'Bắc Giang', 'Vinh', 'Nam Định', 'Thái Nguyên'
];

const VIETNAMESE_FIRST_NAMES = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng',
  'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Đào', 'Lưu', 'Trịnh'
];

const VIETNAMESE_LAST_NAMES = [
  'An', 'Bình', 'Chi', 'Dũng', 'Em', 'Giang', 'Hải', 'Khoa', 'Linh', 'Minh',
  'Nam', 'Oanh', 'Phương', 'Quân', 'Sơn', 'Thảo', 'Uyên', 'Văn', 'Xuân', 'Yến',
  'Thành', 'Hương', 'Tâm', 'Đức', 'Hùng', 'Lan', 'Mai', 'Nga', 'Pha', 'Quý'
];

// Generate random Vietnamese phone number
const generateVietnamesePhone = () => {
  const prefixes = ['090', '091', '094', '083', '084', '085', '081', '082', '070', '079', '077', '076'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return prefix + suffix;
};

// Generate Vietnamese name
const generateVietnameseName = () => {
  const firstName = VIETNAMESE_FIRST_NAMES[Math.floor(Math.random() * VIETNAMESE_FIRST_NAMES.length)];
  const lastName = VIETNAMESE_LAST_NAMES[Math.floor(Math.random() * VIETNAMESE_LAST_NAMES.length)];
  const middleName = Math.random() > 0.3 ? VIETNAMESE_LAST_NAMES[Math.floor(Math.random() * VIETNAMESE_LAST_NAMES.length)] : '';
  
  return middleName ? `${firstName} ${middleName} ${lastName}` : `${firstName} ${lastName}`;
};

// Generate random shipping address
const generateShippingAddress = () => {
  const houseNumber = Math.floor(Math.random() * 999) + 1;
  const streets = ['Lê Lợi', 'Nguyễn Huệ', 'Trần Hưng Đạo', 'Hai Bà Trưng', 'Điện Biên Phủ', 'Lý Thường Kiệt'];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const district = `Quận ${Math.floor(Math.random() * 12) + 1}`;
  const city = VIETNAMESE_CITIES[Math.floor(Math.random() * VIETNAMESE_CITIES.length)];
  return `${houseNumber} ${street}, ${district}, ${city}`;
};

// Generate random date within the last 6 months
const generateRandomDate = () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (Date.now() - sixMonthsAgo.getTime());
  return new Date(randomTime);
};

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function generateFakeUsers() {
  console.log(`👥 Generating ${TOTAL_USERS} fake users...`);
  
  try {
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const users = [];
    
    for (let i = 0; i < TOTAL_USERS; i++) {
      const fullname = generateVietnameseName();
      const timestamp = Date.now();
      const username = `testuser${timestamp}${i}`;
      const email = `${username}@test.com`;
      const phone = generateVietnamesePhone();
      const address = generateShippingAddress();
      
      // Generate random birthday (18-65 years old)
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - Math.floor(Math.random() * 47) - 18; // 18-65 years old
      const birthMonth = Math.floor(Math.random() * 12);
      const birthDay = Math.floor(Math.random() * 28) + 1;
      const birthday = new Date(birthYear, birthMonth, birthDay);
      
      // Random gender
      const gender = Math.random() > 0.5 ? 'male' : 'female';
      
      const userData = {
        username,
        fullname,
        email,
        password: hashedPassword,
        phone,
        gender,
        birthday,
        address,
        role: 'user',
        createdAt: generateRandomDate(),
        updatedAt: new Date()
      };
      
      users.push(userData);
    }
    
    // Insert users in batches
    const batchSize = 25;
    const insertedUsers = [];
    
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const result = await User.insertMany(batch);
      insertedUsers.push(...result);
      console.log(`✅ Inserted user batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)}`);
    }
    
    console.log(`🎉 Successfully created ${insertedUsers.length} fake users`);
    console.log(`🔑 All users have password: ${DEFAULT_PASSWORD}`);
    
    return insertedUsers;
    
  } catch (error) {
    console.error('❌ Error generating fake users:', error);
    throw error;
  }
}

async function generateFakeOrders(availableUsers, availableProducts) {
  console.log(`📦 Generating ${TOTAL_ORDERS} fake orders...`);
  
  try {
    const orders = [];
    
    for (let i = 0; i < TOTAL_ORDERS; i++) {
      // Select random user
      const user = availableUsers[Math.floor(Math.random() * availableUsers.length)];
      
      // Generate 1-4 items per order
      const itemCount = Math.floor(Math.random() * 4) + 1;
      const selectedProducts = [];
      
      for (let j = 0; j < itemCount; j++) {
        const product = availableProducts[Math.floor(Math.random() * availableProducts.length)];
        selectedProducts.push(product);
      }
      
      // Create order items
      const items = selectedProducts.map(product => {
        const quantity = Math.floor(Math.random() * 3) + 1;
        const basePrice = product.price || Math.floor(Math.random() * 450000) + 50000;
        const variation = 0.9 + Math.random() * 0.2; // ±10% variation
        const itemPrice = Math.round(basePrice * variation);
        
        return {
          book_id: product._id,
          quantity: quantity,
          price: itemPrice
        };
      });
      
      // Calculate total price
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shippingFees = [25000, 30000, 35000, 50000];
      const shippingFee = shippingFees[Math.floor(Math.random() * shippingFees.length)];
      const totalPrice = subtotal + shippingFee;
      
      // Generate order data with weighted status
      const statusWeights = [
        { weight: 5, value: 'pending' },
        { weight: 8, value: 'confirmed' },
        { weight: 10, value: 'processing' },
        { weight: 15, value: 'shipping' },
        { weight: 50, value: 'delivered' },
        { weight: 12, value: 'cancelled' }
      ];
      
      const totalWeight = statusWeights.reduce((sum, item) => sum + item.weight, 0);
      const random = Math.random() * totalWeight;
      let cumulativeWeight = 0;
      let selectedStatus = 'delivered';
      
      for (const item of statusWeights) {
        cumulativeWeight += item.weight;
        if (random <= cumulativeWeight) {
          selectedStatus = item.value;
          break;
        }
      }
      
      const orderDate = generateRandomDate();
      
      const orderData = {
        user_id: user._id,
        items: items,
        total_price: totalPrice,
        shipping_fee: shippingFee,
        shipping_address: generateShippingAddress(),
        shipping_phone_number: generateVietnamesePhone(),
        payment_type: PAYMENT_TYPES[Math.floor(Math.random() * PAYMENT_TYPES.length)],
        status: selectedStatus,
        createdAt: orderDate,
        updatedAt: orderDate
      };
      
      orders.push(orderData);
      
      // Progress indicator
      if ((i + 1) % 25 === 0) {
        console.log(`📈 Generated ${i + 1}/${TOTAL_ORDERS} orders...`);
      }
    }
    
    // Insert orders in batches
    console.log('💾 Inserting orders into database...');
    const batchSize = 50;
    
    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize);
      await Order.insertMany(batch);
      console.log(`✅ Inserted order batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(orders.length / batchSize)}`);
    }
    
    console.log(`🎉 Successfully created ${orders.length} fake orders`);
    
  } catch (error) {
    console.error('❌ Error generating fake orders:', error);
    throw error;
  }
}

async function generateStatistics() {
  console.log('\n📊 Generation Statistics:');
  console.log('=================================');
  
  // User statistics
  const totalUsers = await User.countDocuments({ role: 'user' });
  const activeUsers = totalUsers; // All users are considered active
  
  console.log(`👥 Users: ${totalUsers} total (${activeUsers} active)`);
  
  // Order statistics
  const statusCounts = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  console.log('\n📋 Orders by Status:');
  statusCounts.forEach(stat => {
    console.log(`   ${stat._id}: ${stat.count} orders`);
  });
  
  const paymentCounts = await Order.aggregate([
    { $group: { _id: '$payment_type', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  console.log('\n💳 Orders by Payment Type:');
  paymentCounts.forEach(stat => {
    console.log(`   ${stat._id}: ${stat.count} orders`);
  });
  
  const totalRevenue = await Order.aggregate([
    { $match: { status: { $in: ['delivered', 'shipping'] } } },
    { $group: { _id: null, totalRevenue: { $sum: '$total_price' } } }
  ]);
  
  if (totalRevenue.length > 0) {
    const revenue = totalRevenue[0].totalRevenue;
    console.log(`\n💰 Total Revenue (Delivered + Shipping): ${revenue.toLocaleString('vi-VN')} VND`);
  }
  
  const avgOrderValue = await Order.aggregate([
    { $group: { _id: null, avgValue: { $avg: '$total_price' } } }
  ]);
  
  if (avgOrderValue.length > 0) {
    const avg = avgOrderValue[0].avgValue;
    console.log(`📊 Average Order Value: ${Math.round(avg).toLocaleString('vi-VN')} VND`);
  }
}

async function main() {
  try {
    await connectDB();
    
    // Check existing data
    const existingUsers = await User.countDocuments({ role: 'user' });
    const existingOrders = await Order.countDocuments();
    
    console.log(`📈 Current database state:`);
    console.log(`   Users: ${existingUsers}`);
    console.log(`   Orders: ${existingOrders}`);
    
    // Get available products
    const availableProducts = await Book.aggregate([
      { $sample: { size: 50 } },
      { $project: { _id: 1, title: 1, author: 1, price: 1, image: 1, slug: 1 } }
    ]);
    
    if (availableProducts.length === 0) {
      throw new Error('No books found in database. Please import books first.');
    }
    
    console.log(`📚 Found ${availableProducts.length} books for order generation`);
    
    // Generate fake users
    const newUsers = await generateFakeUsers();
    
    // Get all users for order generation
    const allUsers = await User.find({ role: 'user' }).select('_id fullname email');
    
    // Generate fake orders
    await generateFakeOrders(allUsers, availableProducts);
    
    // Show statistics
    await generateStatistics();
    
    console.log('\n🎉 Fake data generation completed successfully!');
    console.log('🔍 You can now test your statistics functions with this realistic data.');
    console.log(`🔑 All generated users have password: ${DEFAULT_PASSWORD}`);
    
  } catch (error) {
    console.error('💥 Script failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n⚠️ Script interrupted by user');
  await mongoose.connection.close();
  process.exit(0);
});

// Export for API usage
export {
  generateFakeUsers,
  generateFakeOrders,
  generateStatistics,
  connectDB
};

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}