import Book from '../models/Book.js';
import csv from 'csv-parser';
import fs from 'fs';
import multer from 'multer';
import path from 'path';

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
        mapHeaders: ({ header }) => {
          // Map CSV headers to our field names
          const headerMap = {
            'Title': 'title',
            'Authors': 'authors',
            'Description': 'description',
            'Category': 'genre',
            'Publisher': 'publisher',
            'Price Starting With ($)': 'price',
            'Publish Date (Month)': 'publishMonth',
            'Publish Date (Year)': 'publishYear'
          };
          return headerMap[header] || header.toLowerCase();
        }
      }));

    csvStream.on('data', (row) => {
      rowIndex++;
      
      try {
        // Parse publish date
        let publishDate = null;
        if (row.publishMonth && row.publishYear) {
          const month = parseMonth(row.publishMonth);
          const year = parseInt(row.publishYear) || new Date().getFullYear();
          publishDate = new Date(year, month, 1);
        }

        // Create book object
        const bookData = {
          title: row.title || `Untitled Book ${rowIndex}`,
          author: cleanAuthor(row.authors),
          summary: row.description || '',
          publisher: row.publisher || '',
          price: parsePrice(row.price),
          genre: cleanGenre(row.genre),
          publishDate: publishDate,
          quantity: 1, // Default quantity
          rating: 0, // Default rating
          sold: 0,
          isDisable: false
        };

        // Validate required fields
        if (!bookData.title.trim()) {
          errors.push(`Row ${rowIndex}: Title is required`);
          return;
        }

        if (bookData.price <= 0) {
          errors.push(`Row ${rowIndex}: Valid price is required`);
          return;
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

        // Insert books into database
        const insertedBooks = await Book.insertMany(books, { ordered: false });

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
