# Test CSV Data for Import

## Sample CSV file for testing import functionality

Create a file named `test_books.csv` with the following content:

```csv
Title,Authors,Description,Category,Publisher,Price Starting With ($),Publish Date (Month),Publish Date (Year)
Goat Brothers,By Colton Larry,"Set in Montana, compelling view of American heartland",History General,Doubleday,$8.79,1,1993
The Missing Person,By Grumbach Doris,"Novel explores themes of identity and belonging",Fiction General,Putnam Pub Group,$4.99,3,1981
Digital Fortress,By Dan Brown,"A thriller about cryptography and digital surveillance",Fiction Thriller,St. Martin's Press,$12.99,5,1998
The Art of Computer Programming,By Donald Knuth,"Comprehensive multi-volume work on algorithms",Computer Science,Addison-Wesley,$79.99,10,1968
Clean Code,By Robert Martin,"A handbook of agile software craftsmanship",Programming,Prentice Hall,$42.50,8,2008
```

## Or use this JSON format directly:

```json
{
  "books": [
    {
      "title": "Goat Brothers",
      "author": "Colton Larry",
      "summary": "Set in Montana, compelling view of American heartland",
      "category": "History General",
      "publisher": "Doubleday",
      "price": "8.79",
      "publishDate": "1993-01-01"
    },
    {
      "title": "The Missing Person",
      "author": "Grumbach Doris",
      "summary": "Novel explores themes of identity and belonging",
      "category": "Fiction General",
      "publisher": "Putnam Pub Group",
      "price": "4.99",
      "publishDate": "1981-03-01"
    },
    {
      "title": "Digital Fortress",
      "author": "Dan Brown",
      "summary": "A thriller about cryptography and digital surveillance",
      "category": "Fiction Thriller",
      "publisher": "St. Martin's Press",
      "price": "12.99",
      "publishDate": "1998-05-01"
    },
    {
      "title": "The Art of Computer Programming",
      "author": "Donald Knuth",
      "summary": "Comprehensive multi-volume work on algorithms",
      "category": "Computer Science",
      "publisher": "Addison-Wesley",
      "price": "79.99",
      "publishDate": "1968-10-01"
    },
    {
      "title": "Clean Code",
      "author": "Robert Martin",
      "summary": "A handbook of agile software craftsmanship",
      "category": "Programming",
      "publisher": "Prentice Hall",
      "price": "42.50",
      "publishDate": "2008-08-01"
    }
  ]
}
```

## How to test:

1. **Login to Admin Dashboard**: http://localhost:3002/login
   - Username: admin
   - Password: 123456

2. **Navigate to Books**: Go to Dashboard > Books

3. **Click Import Books**: Click the "Import Books" button

4. **Choose method**:
   - **CSV Upload**: Upload the CSV file
   - **JSON Input**: Copy and paste the JSON data

5. **Submit**: Click "Start Import"

## Expected Results:

- All 5 books should be imported successfully
- Each book should have proper genre/category mapping
- Publish dates should be formatted correctly
- Prices should be parsed as numbers
- Authors should have "By " prefix removed

## Testing Different Scenarios:

### Valid Data Test:
Use the above data - should import all 5 books successfully.

### Invalid Data Test:
```json
{
  "books": [
    {
      "title": "Valid Book",
      "price": "19.99"
    },
    {
      "title": "",
      "price": "10.00"
    },
    {
      "title": "No Price Book"
    }
  ]
}
```

Expected: 1 success, 2 errors (missing title, missing price)

### Mixed Data Test:
```json
{
  "books": [
    {
      "title": "Complete Book",
      "author": "John Doe",
      "summary": "A complete book with all fields",
      "category": "Fiction",
      "publisher": "Test Publisher",
      "price": "15.99",
      "publishDate": "2024-01-01"
    },
    {
      "title": "Minimal Book",
      "price": "5.99"
    },
    {
      "title": "Book with Author Prefix",
      "author": "By Jane Smith",
      "price": "25.50"
    }
  ]
}
```

Expected: 3 successes, author prefix should be cleaned for the third book.
