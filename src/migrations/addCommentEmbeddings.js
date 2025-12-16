/**
 * Migration script: Add embeddings to existing comments
 * 
 * Script này sẽ:
 * 1. Lấy tất cả comments chưa có embedding
 * 2. Generate embedding cho mỗi comment
 * 3. Cập nhật comment với embedding mới
 * 4. Retry 3 lần nếu thất bại
 * 
 * Usage: node src/migrations/addCommentEmbeddings.js
 */

import mongoose from 'mongoose';
import Comment from '../models/Comment.js';
import { generateEmbedding } from '../services/AI/embedding.service.js';
import { env } from '../config/environment.js';

/**
 * Generate embedding với retry logic
 */
async function generateEmbeddingWithRetry(text, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`  Attempting to generate embedding (attempt ${attempt}/${maxRetries})...`);
      const embedding = await generateEmbedding(text);
      return embedding;
    } catch (error) {
      lastError = error;
      console.error(`  Embedding generation failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`  Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.warn(`  Failed to generate embedding after ${maxRetries} attempts`);
  return null;
}

async function migrateCommentEmbeddings() {
  try {
    console.log('Starting comment embeddings migration...\n');

    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected successfully!\n');

    // Find comments without embeddings or with null embeddings
    const comments = await Comment.find({
      $or: [
        { embedding: { $exists: false } },
        { embedding: null },
        { embedding: [] }
      ],
      comment: { $exists: true, $ne: null, $ne: '' }
    });

    console.log(`Found ${comments.length} comments to process\n`);

    let successCount = 0;
    let failedCount = 0;
    const failedComments = [];

    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];
      console.log(`[${i + 1}/${comments.length}] Processing comment ${comment._id}`);
      console.log(`  Comment text: "${comment.comment.substring(0, 50)}${comment.comment.length > 50 ? '...' : ''}"`);

      try {
        // Generate embedding with retry
        const embedding = await generateEmbeddingWithRetry(comment.comment, 3);
        
        if (embedding) {
          // Update comment with embedding
          await Comment.findByIdAndUpdate(comment._id, { embedding });
          console.log(`  ✓ Successfully updated comment ${comment._id}\n`);
          successCount++;
        } else {
          console.log(`  ✗ Failed to generate embedding for comment ${comment._id}\n`);
          failedCount++;
          failedComments.push(comment._id);
        }

        // Add a small delay between requests to avoid overwhelming the embedding service
        if (i < comments.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`  ✗ Error processing comment ${comment._id}:`, error.message);
        failedCount++;
        failedComments.push(comment._id);
      }
    }

    console.log('\n========================================');
    console.log('Migration completed!');
    console.log(`Total comments: ${comments.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Failed: ${failedCount}`);
    
    if (failedComments.length > 0) {
      console.log('\nFailed comment IDs:');
      failedComments.forEach(id => console.log(`  - ${id}`));
    }
    console.log('========================================\n');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run migration
migrateCommentEmbeddings()
  .then(() => {
    console.log('Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
