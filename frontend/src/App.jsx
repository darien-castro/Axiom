import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [data, setData] = useState('');

  useEffect(() => {
    // Fetch data from the Node.js API endpoint
    fetch('http://localhost:5000/api/number')
      .then((res) => res.json())
      .then((data) => setData(data.message))
      .catch((err) => console.error("Error fetching data:", err));
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Simple React & Node.js Website</h1>
      <p style={{ fontSize: '1.2rem', color: '#555' }}>
        Backend Response: <strong>{data ? data : 'Loading message from server...'}</strong>
      </p>
    </div>
  );
}

export default App;
