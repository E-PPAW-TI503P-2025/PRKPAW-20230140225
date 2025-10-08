 	const express = require('express');
 	const cors = require('cors'); 
 	const app = express();
 	const PORT = 3001;
 	
 	// Middleware
 	app.use(cors()); 
 	app.use(express.json()); 
 	app.use((req, res, next) => {
 	  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
 	  next();
 	});
 	
 	app.get('/', (req, res) => {
 	  res.send('Home Page for API');
 	});
 	
  const bookRoutes = require('./routes/books');
 	app.use('/api/books', bookRoutes);

 	app.listen(PORT, () => {
 	  console.log(`Express server running at http://localhost:${PORT}/`);
 	});
 	
