/**
 * Fake Order Data Generator
 * Creates 150 fake order records with random products from the database
 * Run this script from the FS_API directory: node src/utils/generateFakeOrders.js
 */

import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Book from '../models/Book.js';
import User from '../models/User.js';
import { faker } from '@faker-js/faker';

// MongoDB connection (adjust as needed)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database_name';

// Configuration
const TOTAL_ORDERS = 150;
const ORDER_STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];
const PAYMENT_TYPES = ['cash', 'card', 'online'];

// Vietnamese cities for shipping addresses
const VIETNAMESE_CITIES = [
  'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 
  'Nha Trang', 'Hạ Long', 'Vũng Tàu', 'Đà Lạt', 'Huế',
  'Quy Nhon', 'Biên Hòa', 'Thủ Đức', 'Long Xuyên', 'Mỹ Tho'
];

// Generate random Vietnamese phone number
const generateVietnamesePhone = () => {
  const prefixes = ['090', '091', '094', '083', '084', '085', '081', '082'];
  const prefix = faker.helpers.arrayElement(prefixes);
  const suffix = faker.string.numeric(7);
  return prefix + suffix;
};

// Generate random shipping address
const generateShippingAddress = () => {
  const houseNumber = faker.number.int({ min: 1, max: 999 });
  const street = faker.location.street();
  const district = `Quận ${faker.number.int({ min: 1, max: 12 })}`;
  const city = faker.helpers.arrayElement(VIETNAMESE_CITIES);
  return `${houseNumber} ${street}, ${district}, ${city}`;
};

// Generate random date within the last 6 months
const generateRandomDate = () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return faker.date.between({ from: sixMonthsAgo, to: new Date() });
};

// Calculate price with some variation
const calculateItemPrice = (basePrice, quantity) => {
  // Add some random variation (±10%) to simulate different pricing periods
  const variation = faker.number.float({ min: 0.9, max: 1.1 });
  return Math.round(basePrice * variation * quantity);
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

async function getRandomProducts(count = 5) {
  try {
    // Get total count of books
    const totalBooks = await Book.countDocuments();
    console.log(`📚 Found ${totalBooks} books in database`);
    
    if (totalBooks === 0) {
      throw new Error('No books found in database. Please import books first.');
    }

    // Get random books using aggregation for better performance
    const randomBooks = await Book.aggregate([
      { $sample: { size: Math.min(count, totalBooks) } },
      { $project: { _id: 1, title: 1, author: 1, price: 1, image: 1, slug: 1 } }
    ]);

    return randomBooks;
  } catch (error) {
    console.error('❌ Error fetching random products:', error);
    throw error;
  }
}

async function getRandomUsers(count = 20) {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    console.log(`👥 Found ${totalUsers} users in database`);
    
    if (totalUsers === 0) {
      console.log('⚠️ No users found, will create sample user IDs');
      return [];
    }

    const randomUsers = await User.aggregate([
      { $match: { role: 'user' } },
      { $sample: { size: Math.min(count, totalUsers) } },
      { $project: { _id: 1, fullname: 1, email: 1 } }
    ]);

    return randomUsers;
  } catch (error) {
    console.error('❌ Error fetching random users:', error);
    return [];
  }
}

async function generateFakeOrder(availableProducts, availableUsers) {
  try {
    // Select random user or create a fake user ID
    let userId;
    if (availableUsers.length > 0) {
      userId = faker.helpers.arrayElement(availableUsers)._id;
    } else {
      // Generate a valid ObjectId for testing purposes
      userId = new mongoose.Types.ObjectId();
    }

    // Generate 1-4 items per order
    const itemCount = faker.number.int({ min: 1, max: 4 });
    const selectedProducts = faker.helpers.arrayElements(availableProducts, itemCount);
    
    // Create order items
    const items = selectedProducts.map(product => {
      const quantity = faker.number.int({ min: 1, max: 3 });
      const basePrice = product.price || faker.number.int({ min: 50000, max: 500000 });
      const itemPrice = calculateItemPrice(basePrice, 1); // Price per unit
      
      return {
        book_id: product._id,
        quantity: quantity,
        price: itemPrice
      };
    });

    // Calculate total price
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = faker.helpers.arrayElement([25000, 30000, 35000, 50000]); // Common shipping fees
    const totalPrice = subtotal + shippingFee;

    // Generate order data
    const orderDate = generateRandomDate();
    const status = faker.helpers.arrayElement(ORDER_STATUS_OPTIONS);
    
    // Adjust status probability (more delivered orders for better statistics)
    const statusWithWeight = faker.helpers.weightedArrayElement([
      { weight: 5, value: 'pending' },
      { weight: 8, value: 'confirmed' },
      { weight: 10, value: 'processing' },
      { weight: 15, value: 'shipping' },
      { weight: 50, value: 'delivered' },
      { weight: 12, value: 'cancelled' }
    ]);

    const orderData = {
      user_id: userId,
      items: items,
      total_price: totalPrice,
      shipping_fee: shippingFee,
      shipping_address: generateShippingAddress(),
      shipping_phone_number: generateVietnamesePhone(),
      payment_type: faker.helpers.arrayElement(PAYMENT_TYPES),
      status: statusWithWeight,
      createdAt: orderDate,
      updatedAt: orderDate
    };

    return orderData;
  } catch (error) {
    console.error('❌ Error generating fake order:', error);
    throw error;
  }
}

async function generateAllFakeOrders() {
  console.log(`🚀 Starting to generate ${TOTAL_ORDERS} fake orders...`);
  
  try {
    // Get available products and users
    const availableProducts = await getRandomProducts(50); // Get more products for variety
    const availableUsers = await getRandomUsers(30);
    
    if (availableProducts.length === 0) {
      throw new Error('No products available. Please import books first.');
    }

    console.log(`📦 Using ${availableProducts.length} products for order generation`);
    console.log(`👤 Using ${availableUsers.length} users for order generation`);

    // Generate all orders
    const orders = [];
    for (let i = 0; i < TOTAL_ORDERS; i++) {
      const order = await generateFakeOrder(availableProducts, availableUsers);
      orders.push(order);
      
      // Progress indicator
      if ((i + 1) % 25 === 0) {
        console.log(`📈 Generated ${i + 1}/${TOTAL_ORDERS} orders...`);
      }
    }

    // Insert orders in batches for better performance
    console.log('💾 Inserting orders into database...');
    const batchSize = 50;
    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize);
      await Order.insertMany(batch);
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(orders.length / batchSize)}`);
    }

    // Generate statistics
    console.log('\n📊 Order Generation Statistics:');
    console.log('=================================');
    
    const statusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('📋 Orders by Status:');
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

    console.log(`\n🎉 Successfully generated ${TOTAL_ORDERS} fake orders!`);
    console.log('🔍 You can now test your statistics functions with this data.');
    
  } catch (error) {
    console.error('❌ Error generating fake orders:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    
    // Check if orders already exist
    const existingOrderCount = await Order.countDocuments();
    if (existingOrderCount > 0) {
      console.log(`⚠️ Found ${existingOrderCount} existing orders.`);
      console.log('Do you want to continue? This will add more orders to existing ones.');
      // You can add confirmation logic here if needed
    }

    await generateAllFakeOrders();
    
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

// Run the script
main().catch(console.error);