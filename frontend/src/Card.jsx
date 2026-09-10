export default function Card({ Class, Description, Year, onClick }) {
  return (
    <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px', margin: '10px' }}>
      <h3>{Class}</h3>
      <p style={{ color: '#888', fontSize: '0.9rem', margin: '0 0 8px 0' }}>{Year}</p>
      <p>{Description}</p>
      
      {onClick && <button onClick={onClick}>Click Me</button>}
    </div>
  );
}
