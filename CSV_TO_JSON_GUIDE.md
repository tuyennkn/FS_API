# Tool Chuyển Đổi CSV sang JSON cho Import API

## Hướng dẫn sử dụng

### 1. Chuẩn bị dữ liệu CSV
Format CSV của bạn:
```csv
Title,Authors,Description,Category,Publisher,Price Starting With ($),Publish Date (Month),Publish Date (Year)
```

### 2. Chuyển đổi sang JSON
Sử dụng script Python dưới đây để convert CSV sang format JSON phù hợp với API:

```python
import csv
import json
import re
from datetime import datetime

def convert_csv_to_json(csv_file_path, output_file_path):
    books = []
    
    with open(csv_file_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        
        for row in reader:
            # Clean và transform dữ liệu
            book = {}
            
            # Title (required)
            title = row.get('Title', '').strip()
            if title:
                book['title'] = title
            
            # Author (remove "By " prefix)
            author = row.get('Authors', '').strip()
            if author:
                if author.startswith('By '):
                    author = author[3:]
                book['author'] = author
            
            # Summary/Description
            summary = row.get('Description', '').strip()
            if summary:
                book['summary'] = summary
            
            # Category/Genre
            category = row.get('Category', '').strip()
            if category:
                book['category'] = category
            
            # Publisher
            publisher = row.get('Publisher', '').strip()
            if publisher:
                book['publisher'] = publisher
            
            # Price (required, remove $ and convert to number)
            price_str = row.get('Price Starting With ($)', '').strip()
            if price_str:
                # Remove $ and any other non-numeric characters except decimal point
                price_clean = re.sub(r'[^\d.]', '', price_str)
                if price_clean:
                    book['price'] = price_clean
            
            # Publish Date (combine month and year)
            month = row.get('Publish Date (Month)', '').strip()
            year = row.get('Publish Date (Year)', '').strip()
            
            if year and year.isdigit():
                if month and month.isdigit():
                    # Create date with month and year
                    try:
                        publish_date = f"{year}-{month.zfill(2)}-01"
                        book['publishDate'] = publish_date
                    except:
                        pass
                else:
                    # Only year available
                    book['publishDate'] = f"{year}-01-01"
            
            # Only add book if it has required fields
            if 'title' in book and 'price' in book:
                books.append(book)
    
    # Create final JSON structure
    result = {
        "books": books
    }
    
    # Save to file
    with open(output_file_path, 'w', encoding='utf-8') as output_file:
        json.dump(result, output_file, indent=2, ensure_ascii=False)
    
    print(f"Converted {len(books)} books successfully!")
    print(f"Output saved to: {output_file_path}")
    
    return result

# Sử dụng
if __name__ == "__main__":
    # Thay đổi đường dẫn file phù hợp
    csv_file = "books_data.csv"
    json_file = "books_import.json"
    
    result = convert_csv_to_json(csv_file, json_file)
    
    # Preview first few books
    print("\nPreview first 2 books:")
    for i, book in enumerate(result['books'][:2]):
        print(f"Book {i+1}:")
        print(json.dumps(book, indent=2, ensure_ascii=False))
        print("-" * 50)
```

### 3. Manual Conversion (cho file nhỏ)

Ví dụ chuyển đổi thủ công:

**CSV Input:**
```csv
Title,Authors,Description,Category,Publisher,Price Starting With ($),Publish Date (Month),Publish Date (Year)
Goat Brothers,By Colton Larry,"Set in Montana, compelling view of American heartland",History General,Doubleday,$8.79,1,1993
The Missing Person,By Grumbach Doris,"Novel explores themes of identity and belonging",Fiction General,Putnam Pub Group,$4.99,3,1981
```

**JSON Output:**
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
    }
  ]
}
```

### 4. Validation Rules

**Required Fields:**
- `title`: Không được để trống
- `price`: Phải là số hợp lệ

**Optional Fields:**
- `author`: Sẽ tự động loại bỏ prefix "By "
- `summary`: Mô tả sách
- `category`: Thể loại sách
- `publisher`: Nhà xuất bản
- `publishDate`: Format YYYY-MM-DD

**Data Cleaning:**
- Price: Loại bỏ ký tự $, dấu phẩy
- Author: Loại bỏ prefix "By "
- Date: Combine month và year thành format chuẩn

### 5. Testing

Sau khi có file JSON, sử dụng file `import-books.http` để test:

1. Login để lấy admin token
2. Copy token vào Authorization header
3. Copy nội dung JSON vào body request
4. Send request để import

### 6. Error Handling

API sẽ báo lỗi chi tiết nếu:
- Thiếu field required (title, price)
- Format dữ liệu không hợp lệ
- Lỗi authentication/authorization
- Lỗi database

API hỗ trợ partial import - nghĩa là sẽ import được những record hợp lệ và báo lỗi cho những record có vấn đề.
