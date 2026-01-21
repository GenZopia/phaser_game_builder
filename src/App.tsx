import React from 'react';
import { EditorProvider } from './context/EditorContext';
import GameEditor from './components/Editor/GameEditor';
import './App.css';

function App() {
  console.log('App component is rendering');
  
  try {
    return (
      <EditorProvider>
        <div className="app">
          <GameEditor />
        </div>
      </EditorProvider>
    );
  } catch (error) {
    console.error('Error in App component:', error);
    return (
      <div style={{ color: 'red', padding: '20px', background: 'white' }}>
        <h1>Error in App</h1>
        <p>Error: {error.message}</p>
        <pre>{error.stack}</pre>
      </div>
    );
  }
}

export default App;
