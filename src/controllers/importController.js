import Book from '../models/Book.js';
import csv from 'csv-parser';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { generateEmbedding } from '../services/AI/embedding.service.js';
import { embeddingTextGenerator } from '../utils/algorithms.js';
import { handleCategoryForBook } from '../services/categoryAnalysis.service.js';

// Configure multer for CSV file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, 'books_import_' + Date.now() + '.csv');
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname) === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Helper function to parse month name to number
const parseMonth = (monthStr) => {
  const months = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3,
    'May': 4, 'June': 5, 'July': 6, 'August': 7,
    'September': 8, 'October': 9, 'November': 10, 'December': 11
  };
  return months[monthStr] || 0;
};

// Helper function to clean and parse price
const parsePrice = (priceStr) => {
  if (!priceStr) return 0;
  // Remove $ sign and any other non-numeric characters except decimal point
  const cleanPrice = priceStr.toString().replace(/[^0-9.]/g, '');
  return parseFloat(cleanPrice) || 0;
};

// Helper function to clean author name
const cleanAuthor = (authorStr) => {
  if (!authorStr) return '';
  // Remove "By " prefix and clean up
  return authorStr.replace(/^By\s+/i, '').replace(/[,;]+$/, '').trim();
};

// Helper function to clean genre
const cleanGenre = (genreStr) => {
  if (!genreStr) return '';
  // Clean up genre string, remove extra spaces and commas
  return genreStr.replace(/^\s*,\s*/, '').replace(/\s*,\s*$/, '').trim();
};

// Import books from CSV
export const importBooksFromCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No CSV file uploaded',
        statusCode: 400
      });
    }

    const csvFilePath = req.file.path;
    const books = [];
    const errors = [];
    let rowIndex = 0;

    // Read and parse CSV file
    const csvStream = fs.createReadStream(csvFilePath)
      .pipe(csv({
        strict: false, // Allow flexible parsing
        skipLines: 0,
        // Disable automatic type conversion to preserve ISBN as string
        mapValues: ({ header, index, value }) => {
          // Keep ISBN as string to prevent precision loss
          if (header === 'isbn' && value) {
            return String(value).trim();
          }
          return value;
        },
        mapHeaders: ({ header }) => {
          // Map CSV headers to our field names based on the actual CSV format
          const headerMap = {
            'bookId': 'bookId',
            'title': 'title',
            'series': 'series',
            'author': 'authors',
            'rating': 'rating',
            'description': 'description',
            'language': 'language',
            'isbn': 'isbn',
            'genres': 'genres',
            'characters': 'characters',
            'bookFormat': 'bookFormat',
            'edition': 'edition',
            'pages': 'pages',
            'publisher': 'publisher',
            'publishDate': 'publishDate',
            'firstPublishDate': 'firstPublishDate',
            'awards': 'awards',
            'numRatings': 'numRatings',
            'ratingsByStars': 'ratingsByStars',
            'likedPercent': 'likedPercent',
            'setting': 'setting',
            'coverImg': 'coverImg',
            'bbeScore': 'bbeScore',
            'bbeVotes': 'bbeVotes',
            'price': 'price'
          };
          return headerMap[header] || header.toLowerCase();
        }
      }));

    csvStream.on('data', (row) => {
      rowIndex++;
      
      try {
        // Parse publish date
        let publishDate = null;
        if (row.publishDate) {
          try {
            // Handle date format like "09/14/08"
            publishDate = new Date(row.publishDate);
            if (isNaN(publishDate.getTime())) {
              publishDate = null;
            }
          } catch (e) {
            publishDate = null;
          }
        }

        // Helper function to parse array fields from string
        const parseArrayField = (field) => {
          if (!field) return null;
          if (Array.isArray(field)) return field;
          try {
            const parsed = JSON.parse(field.replace(/'/g, '"'));
            return Array.isArray(parsed) ? parsed : null;
          } catch (e) {
            return null;
          }
        };

        // Parse genres array from string like "['Young Adult', 'Fiction', 'Dystopia']"
        let genre = '';
        if (row.genres) {
          try {
            const genresArray = JSON.parse(row.genres.replace(/'/g, '"'));
            genre = Array.isArray(genresArray) ? genresArray.join(', ') : row.genres;
          } catch (e) {
            genre = row.genres;
          }
        }

        // Generate slug from title
        const slug = (row.title || '').toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') + '-' + Date.now();

        // Create book object with new schema
        const bookData = {
          title: row.title || `Untitled Book ${rowIndex}`,
          author: row.authors || '',
          description: row.description || '',
          slug: slug,
          publisher: row.publisher || '',
          price: parsePrice(row.price) || 0,
          rating: parseFloat(row.rating) || 0,
          genre: cleanGenre(genre),
          quantity: 1, // Default quantity
          sold: 0,
          image: row.coverImg ? [row.coverImg] : [],
          isDisable: false,

          // Map to attributes object for additional fields
          attributes: {
            isbn: row.isbn ? String(row.isbn).trim() : null, // Ensure ISBN is string
            pages: row.pages ? parseInt(row.pages) : null,
            language: row.language || null,
            edition: row.edition || null,
            bookFormat: row.bookFormat || null,
            series: row.series || null,
            awards: parseArrayField(row.awards),
            characters: parseArrayField(row.characters),
            setting: row.setting || null
          }
        };

        // Validate required fields
        if (!bookData.title || !bookData.title.trim()) {
          errors.push(`Row ${rowIndex}: Title is required`);
          return;
        }

        // Price is optional, set to 0 if not provided or invalid
        if (isNaN(bookData.price) || bookData.price < 0) {
          bookData.price = 0;
        }

        books.push(bookData);

      } catch (error) {
        errors.push(`Row ${rowIndex}: ${error.message}`);
      }
    });

    csvStream.on('end', async () => {
      try {
        // Clean up uploaded file
        fs.unlinkSync(csvFilePath);

        if (books.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No valid books found in CSV',
            errors: errors,
            statusCode: 400
          });
        }

        // Process books: generate embeddings and handle categories
        const processedBooks = [];
        const batchSize = 10; // Process in small batches to avoid memory issues

        for (let i = 0; i < books.length; i += batchSize) {
          const batch = books.slice(i, i + batchSize);
          
          for (const bookData of batch) {
            try {
              // Generate embedding for the book
              if (bookData.title && bookData.description) {
                const embedding = await generateEmbedding(
                  embeddingTextGenerator(bookData)
                );
                bookData.embedding = embedding;
              }

              // Create the book
              const book = new Book(bookData);
              await book.save();
              
              // Handle category assignment or create pending category
              if (bookData.genre && !bookData.category) {
                try {
                  const matchedCategory = await handleCategoryForBook({
                    genre: bookData.genre,
                    _id: book._id,
                    title: book.title,
                    author: book.author,
                    image: book.image
                  });

                  if (matchedCategory) {
                    book.category = matchedCategory._id;
                    await book.save();
                    console.log(`Auto-assigned category: ${matchedCategory.name} to book: ${book.title} (CSV import)`);
                  } else {
                    console.log(`Created pending category for book: ${book.title} with genre: ${bookData.genre} (CSV import)`);
                  }
                } catch (categoryError) {
                  console.error('Error handling category for book during CSV import:', categoryError);
                  // Don't fail book creation if category handling fails
                }
              }

              processedBooks.push(book);
            } catch (bookError) {
              console.error(`Error processing book: ${bookData.title}`, bookError);
              errors.push(`Error processing book: ${bookData.title} - ${bookError.message}`);
            }
          }
        }

        const insertedBooks = processedBooks;

        res.status(201).json({
          success: true,
          message: `Successfully imported ${insertedBooks.length} books`,
          data: {
            imported: insertedBooks.length,
            total_rows: rowIndex,
            errors: errors,
            books: insertedBooks
          },
          statusCode: 201
        });

      } catch (dbError) {
        console.error('Database insertion error:', dbError);
        
        // Handle duplicate key errors
        if (dbError.code === 11000) {
          const duplicateErrors = dbError.writeErrors?.map(err => 
            `Duplicate book found: ${err.err.op.title}`
          ) || ['Some books already exist'];
          
          return res.status(400).json({
            success: false,
            message: 'Some books could not be imported due to duplicates',
            errors: [...errors, ...duplicateErrors],
            statusCode: 400
          });
        }

        res.status(500).json({
          success: false,
          message: 'Database error during import',
          error: dbError.message,
          statusCode: 500
        });
      }
    });

    csvStream.on('error', (error) => {
      // Clean up uploaded file
      if (fs.existsSync(csvFilePath)) {
        fs.unlinkSync(csvFilePath);
      }

      res.status(400).json({
        success: false,
        message: 'Error reading CSV file',
        error: error.message,
        statusCode: 400
      });
    });

  } catch (error) {
    console.error('CSV import error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during CSV import',
      error: error.message,
      statusCode: 500
    });
  }
};

// Get import template
export const getImportTemplate = async (req, res) => {
  try {
    const templateData = [
      {
        'Title': 'Sample Book Title',
        'Authors': 'By John Doe',
        'Description': 'This is a sample book description',
        'Category': 'Fiction, General',
        'Publisher': 'Sample Publisher',
        'Price Starting With ($)': '$19.99',
        'Publish Date (Month)': 'January',
        'Publish Date (Year)': '2024'
      }
    ];

    res.status(200).json({
      success: true,
      message: 'Import template structure',
      data: {
        template: templateData,
        required_fields: ['Title', 'Price Starting With ($)'],
        optional_fields: ['Authors', 'Description', 'Category', 'Publisher', 'Publish Date (Month)', 'Publish Date (Year)'],
        field_descriptions: {
          'Title': 'Book title (required)',
          'Authors': 'Author names, can include "By " prefix',
          'Description': 'Book description or summary',
          'Category': 'Book genre/category',
          'Publisher': 'Publishing company',
          'Price Starting With ($)': 'Price in USD with $ symbol (required)',
          'Publish Date (Month)': 'Month name (e.g., January, February)',
          'Publish Date (Year)': 'Publication year (e.g., 2024)'
        }
      },
      statusCode: 200
    });

  } catch (error) {
    console.error('Template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting import template',
      error: error.message,
      statusCode: 500
    });
  }
};

// Middleware export
export const uploadCSV = upload.single('csvFile');
