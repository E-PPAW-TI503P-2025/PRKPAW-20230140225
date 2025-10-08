// file routes/books.js
const express = require('express');
const router = express.Router();

let books = [
  {id: 1, title: 'Book 1', author: 'Author 1'},
  {id: 2, title: 'Book 2', author: 'Author 2'}
];

// GET all books
router.get('/', (req, res) => {
  res.json(books);
});

// GET book by ID
router.get('/:id', (req, res) => {
  const book = books.find(b => b.id === parseInt(req.params.id));
  if (!book) return res.status(404).send('Book not found');
  res.json(book);
});

// POST a new book
router.post('/', (req, res) => {
  const { title, author } = req.body;
  if (!title || !author) {
      return res.status(400).json({ message: 'Title and author are required' });
  }
  const book = {
    id: books.length > 0 ? books[books.length - 1].id + 1 : 1, // Safer way to get next ID
    title,
    author
  };
  books.push(book);
  res.status(201).json(book);
});

// ---

// PUT (Update) a book by ID
router.put('/:id', (req, res) => {
  const bookId = parseInt(req.params.id);
  const { title, author } = req.body;
  
  // 1. Find the book's index
  const bookIndex = books.findIndex(b => b.id === bookId);
  
  // 2. Check if book exists
  if (bookIndex === -1) {
    return res.status(404).send('Book not found');
  }

  // 3. Optional: Basic input validation
  if (!title || !author) {
      return res.status(400).json({ message: 'Title and author are required for update' });
  }
  
  // 4. Update the book object
  books[bookIndex] = {
    ...books[bookIndex], // Keep existing properties (like ID)
    title,
    author
  };
  
  // 5. Send the updated book back
  res.json(books[bookIndex]);
});

// ---

// DELETE a book by ID
router.delete('/:id', (req, res) => {
  const bookId = parseInt(req.params.id);
  
  // 1. Find the book's index
  const bookIndex = books.findIndex(b => b.id === bookId);

  // 2. Check if book exists
  if (bookIndex === -1) {
    // Return 404 if not found, or 204 (No Content) if you prefer
    return res.status(404).send('Book not found');
  }

  // 3. Remove the book from the array using splice
  books.splice(bookIndex, 1);
  
  // 4. Send a 204 No Content status to indicate successful deletion
  res.status(204).send();
});

module.exports = router;