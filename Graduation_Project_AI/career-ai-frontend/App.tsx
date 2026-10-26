import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import JobSearchModern from './src/pages/JobSearchModern'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<JobSearchModern />} />
        <Route path="/jobs" element={<JobSearchModern />} />
      </Routes>
    </Router>
  );
}

export default App;