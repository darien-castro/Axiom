const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/api/message', (req, res) => {
    res.json({ message: "Hello from the Node.js backend!" });
});

app.get('/api/number', (req, res) => {
  res.json({ message : "10"});
});



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
