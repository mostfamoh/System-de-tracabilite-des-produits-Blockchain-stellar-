import React from 'react';

const TestPage = () => {
  console.log('TestPage is rendering');
  
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', minHeight: '100vh' }}>
      <h1 style={{ color: 'black', fontSize: '24px', marginBottom: '20px' }}>
        Test Page - If you see this, React is working!
      </h1>
      <div style={{ backgroundColor: '#f0f0f0', padding: '20px', borderRadius: '8px' }}>
        <p style={{ color: 'black' }}>This is a test page to verify routing is working.</p>
        <p style={{ color: 'black' }}>Timestamp: {new Date().toISOString()}</p>
      </div>
    </div>
  );
};

export default TestPage;
