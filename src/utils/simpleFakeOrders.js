/**
 * Simple Fake Order Data Generator (No External Dependencies)
 * Creates 150 fake order records with random products from the database
 * Run: node src/utils/simpleFakeOrders.js
 */

import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Book from '../models/Book.js';
import User from '../models/User.js';

// Configuration
const TOTAL_ORDERS = 150;
const ORDER_STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];
const PAYMENT_TYPES = ['cash', 'card', 'online'];

// Simple random generators
const random = {
  int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  float: (min, max) => Math.random() * (max - min) + min,
  choice: (array) => array[Math.floor(Math.random() * array.length)],
  choices: (array, count) => {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  },
  boolean: () => Math.random() > 0.5,
  date: (daysBack = 180) => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - (Math.random() * daysBack * 24 * 60 * 60 * 1000));
    return pastDate;
  }
};

// Vietnamese sample data
const SAMPLE_DATA = {
  cities: [
    'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 
    'Nha Trang', 'Hạ Long', 'Vũng Tàu', 'Đà Lạt', 'Huế',
    'Quy Nhon', 'Biên Hòa', 'Thủ Đức', 'Long Xuyên', 'Mỹ Tho'
  ],
  streets: [
    'Nguyễn Trái', 'Lê Lợi', 'Hai Bà Trưng', 'Trần Hưng Đạo', 'Lý Thường Kiệt',
    'Nguyễn Huệ', 'Điện Biên Phủ', 'Võ Văn Tần', 'Pasteur', 'Cách Mạng Tháng 8'
  ],
  phonePrefixes: ['090', '091', '094', '083', '084', '085', '081', '082', '096', '097']
};

const generatePhone = () => {
  const prefix = random.choice(SAMPLE_DATA.phonePrefixes);
  const suffix = random.int(1000000, 9999999).toString();
  return prefix + suffix;
};

const generateAddress = () => {
  const houseNumber = random.int(1, 999);
  const street = random.choice(SAMPLE_DATA.streets);
  const district = `Quận ${random.int(1, 12)}`;
  const city = random.choice(SAMPLE_DATA.cities);
  return `${houseNumber} ${street}, ${district}, ${city}`;
};

const generatePrice = (basePrice) => {
  const variation = random.float(0.9, 1.1);
  return Math.round(basePrice * variation);
};

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

async function getRandomProducts(limit = 50) {
  try {
    const count = await Book.countDocuments();
    console.log(`📚 Found ${count} books in database`);
    
    if (count === 0) {
      throw new Error('No books found! Please import books first.');
    }

    // Get random books
    const books = await Book.aggregate([
      { $sample: { size: Math.min(limit, count) } },
      { $project: { _id: 1, title: 1, price: 1 } }
    ]);

    return books;
  } catch (error) {
    console.error('❌ Error fetching books:', error);
    throw error;
  }
}

async function getRandomUsers(limit = 30) {
  try {
    const count = await User.countDocuments({ role: 'user' });
    console.log(`👥 Found ${count} users in database`);
    
    if (count === 0) {
      console.log('⚠️ No users found, will use fake user IDs');
      return [];
    }

    const users = await User.aggregate([
      { $match: { role: 'user' } },
      { $sample: { size: Math.min(limit, count) } },
      { $project: { _id: 1 } }
    ]);

    return users;
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return [];
  }
}

function createFakeOrder(products, users) {
  // Select user
  const userId = users.length > 0 
    ? random.choice(users)._id 
    : new mongoose.Types.ObjectId();

  // Create 1-4 items per order
  const itemCount = random.int(1, 4);
  const selectedProducts = random.choices(products, itemCount);
  
  const items = selectedProducts.map(product => {
    const quantity = random.int(1, 3);
    const basePrice = product.price || random.int(50000, 500000);
    const price = generatePrice(basePrice);
    
    return {
      book_id: product._id,
      quantity: quantity,
      price: price
    };
  });

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFees = [25000, 30000, 35000, 50000];
  const shippingFee = random.choice(shippingFees);
  const totalPrice = subtotal + shippingFee;

  // Weighted status selection (more delivered orders)
  const statusWeights = {
    'pending': 5,
    'confirmed': 8, 
    'processing': 10,
    'shipping': 15,
    'delivered': 50,
    'cancelled': 12
  };
  
  const statusArray = [];
  Object.entries(statusWeights).forEach(([status, weight]) => {
    for (let i = 0; i < weight; i++) {
      statusArray.push(status);
    }
  });

  const orderDate = random.date(180); // Last 6 months

  return {
    user_id: userId,
    items: items,
    total_price: totalPrice,
    shipping_fee: shippingFee,
    shipping_address: generateAddress(),
    shipping_phone_number: generatePhone(),
    payment_type: random.choice(PAYMENT_TYPES),
    status: random.choice(statusArray),
    createdAt: orderDate,
    updatedAt: orderDate
  };
}

async function generateFakeOrders() {
  console.log(`🚀 Generating ${TOTAL_ORDERS} fake orders...`);
  
  try {
    // Get data
    const products = await getRandomProducts(50);
    const users = await getRandomUsers(30);

    if (products.length === 0) {
      throw new Error('No products available!');
    }

    console.log(`📦 Using ${products.length} products`);
    console.log(`👤 Using ${users.length} users`);

    // Generate orders
    const orders = [];
    for (let i = 0; i < TOTAL_ORDERS; i++) {
      orders.push(createFakeOrder(products, users));
      
      if ((i + 1) % 30 === 0) {
        console.log(`📈 Generated ${i + 1}/${TOTAL_ORDERS} orders`);
      }
    }

    // Insert in batches
    console.log('💾 Saving to database...');
    const batchSize = 25;
    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize);
      await Order.insertMany(batch);
      console.log(`✅ Saved batch ${Math.floor(i / batchSize) + 1}`);
    }

    // Show statistics
    console.log('\n📊 Generation Complete!');
    console.log('========================');
    
    const stats = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('Status breakdown:');
    stats.forEach(s => console.log(`  ${s._id}: ${s.count}`));

    const revenue = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipping'] } } },
      { $group: { _id: null, total: { $sum: '$total_price' } } }
    ]);

    if (revenue.length > 0) {
      console.log(`\n💰 Revenue: ${revenue[0].total.toLocaleString('vi-VN')} VND`);
    }

    console.log(`\n🎉 Success! Generated ${TOTAL_ORDERS} orders for testing.`);
    
  } catch (error) {
    console.error('❌ Generation failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    
    const existing = await Order.countDocuments();
    if (existing > 0) {
      console.log(`ℹ️ Found ${existing} existing orders (will add ${TOTAL_ORDERS} more)`);
    }

    await generateFakeOrders();
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
}

main();