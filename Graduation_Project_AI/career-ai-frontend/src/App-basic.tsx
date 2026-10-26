import React from 'react'

const App: React.FC = () => {
  return React.createElement('div', {
    style: {
      padding: '20px',
      background: 'white',
      color: 'black',
      fontSize: '18px'
    }
  }, 'HELLO WORLD - If you see this, React is working!')
}

export default App
