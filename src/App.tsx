import './App.css'
import KnowledgeGraph from './components/KnowledgeGraph'
import ConnectionTest from './components/ConnectionTest'

function App() {
  return (
    <div className="app">
      <h1>Knowledge Graph Visualization</h1>
      <ConnectionTest />
      <KnowledgeGraph />
    </div>
  )
}

export default App
