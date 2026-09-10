import { useState, useEffect } from 'react';
import LiquidGlass from 'liquid-glass-react';
import './App.css';

function App() {
  const [data, setData] = useState([]);

  const CourseCardClicked = () => {
    alert('course card clicked');
  }

  useEffect(() => {
    fetch('http://localhost:5000/api/message')
      .then((res) => res.json())
      .then((data) => setData(data.message))
      .catch((err) => console.error("Error fetching data:", err));
  }, []);

  return (
    <div className="page">
    <div className="background">
      <h1 className="Title">Axiom</h1>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '600px'
      }}>

        <span style={{ fontSize: '1.2rem', color: '#555', marginBottom: '20px', fontWeight: 'bold' }}>
          Courses:
        </span>

        {data.length > 0 ? (
          data.map((course, index) => (
            // need a better way for telling which courses are classes and not introductory programs
            // also need a better way to get substring, strings might not always be fixed lenght
            <div style={{ padding: '10vh' }}>
                {course.includes("202680") && (
                  <div className="card_background">
                    <p className="glowing">{course.substring(31)}</p>
                  </div>
              )}
            </div>
          ))
        ) : (
          <span style={{ color: '#555', fontWeight: 'bold' }}>waiting...</span>
        )}
      </div>
    </div>

    <div className="background">
      <h1 className="Title">Due Soon</h1>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '600px'
      }}>

        <span style={{ fontSize: '1.2rem', color: '#555', marginBottom: '20px', fontWeight: 'bold' }}>
          Courses:
        </span>

        {data.length > 0 ? (
          data.map((course, index) => (
            // need a better way for telling which courses are classes and not introductory programs
            // also need a better way to get substring, strings might not always be fixed lenght
            <div style={{ padding: '10vh' }}>
                {course.includes("202680") && (
                  <div className="card_background">
                    <p className="glowing">{course.substring(31)}</p>
                  </div>
              )}
            </div>
          ))
        ) : (
          <span style={{ color: '#555', fontWeight: 'bold' }}>waiting...</span>
        )}
      </div>
    </div>

  </div>
  );
}

export default App;
