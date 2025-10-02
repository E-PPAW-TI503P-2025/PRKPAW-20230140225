const express = require('express');
const cors = require("cors");

const app = express();
const port = 5001;

app.use (cors());

app.get('/', (req, res) => {
  res.json({ message: 'Selamat datang ahmad fauzan isnata!' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
