/**
 * Updated by trungquandev.com's author on August 17 2023
 * YouTube: https://youtube.com/@trungquandev
 * "A bit of fragrance clings to the hand that gives flowers!"
 */
export const embeddingTextGenerator = (book) => {
  return `Title: ${book.title} | Genre: ${book.genre} | Author: ${book.author} | Description: ${book.description || book.summary}`;
}