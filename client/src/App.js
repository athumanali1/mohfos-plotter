import React, { useEffect, useMemo, useState } from 'react';
import { Brain, LayoutGrid, Menu, Send, Terminal, X } from 'lucide-react';
import QuestionInput from './components/QuestionInput';
import GraphVisualization from './components/GraphVisualization';
import ArduinoStatus from './components/ArduinoStatus';
import BluetoothConnect from './components/BluetoothConnect';
import Transport from './services/Transport';
import Api from './services/Api';
import Sidebar from './components/Sidebar';
import CommandsView from './components/CommandsView';
import WorkingsView from './components/WorkingsView';
import './App.css';

function App() {
  const [question, setQuestion] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [arduinoConnected, setArduinoConnected] = useState(false);
  const [usingBluetooth, setUsingBluetooth] = useState(false);
  const [activeView, setActiveView] = useState('graph');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeHistoryId, setActiveHistoryId] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mohfos_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
          if (parsed[0]?.id) setActiveHistoryId(parsed[0].id);
        }
      }
    } catch (_) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('mohfos_history', JSON.stringify(history));
    } catch (_) {
      // ignore
    }
  }, [history]);

  const commandPreview = useMemo(() => {
    if (!analysis) return '';
    return generateCommandPreview(analysis);
  }, [analysis]);

  const pickHistory = (id) => {
    const item = history.find((h) => h.id === id);
    if (!item) return;
    setActiveHistoryId(id);
    setQuestion(item.question);
    setAnalysis(item.analysis);
    setActiveView('graph');
    setError('');
    setSidebarOpen(false);
  };

  const handleAnalyze = async () => {
    if (!question.trim()) {
      setError('Please enter a graph question');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const data = await Api.analyze(question);
      setAnalysis(data);

      const newItem = {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        question: question.trim(),
        analysis: data,
        createdAt: Date.now(),
      };
      setHistory((prev) => [newItem, ...prev].slice(0, 30));
      setActiveHistoryId(newItem.id);
    } catch (err) {
      setError(err?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToArduino = async () => {
    if (!analysis) return;

    try {
      const result = await Transport.sendPlottingData(analysis);
      if (result?.success) {
        alert(`Successfully sent ${result.commandsSent || 'plot'} commands to device!`);
      } else {
        setError(result?.error || 'Failed to send to device');
      }
    } catch (err) {
      setError('Failed to communicate with device');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
                aria-label="Open sidebar"
              >
                <Menu className="h-6 w-6 text-gray-700" />
              </button>
              <Brain className="h-8 w-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">moHFoS Plotter</h1>
            </div>
            <ArduinoStatus connected={arduinoConnected} />
          </div>
          <p className="mt-2 text-gray-600">
            AI-integrated graph plotting with Arduino physical drawing
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div className="hidden lg:block h-[calc(100vh-220px)] sticky top-6">
            <Sidebar
              history={history}
              activeHistoryId={activeHistoryId}
              onPickHistory={pickHistory}
            />
          </div>

          <div className="space-y-6">
            <QuestionInput
              question={question}
              setQuestion={setQuestion}
              onAnalyze={handleAnalyze}
              loading={loading}
              showSamples={false}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {analysis && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{analysis.equation || 'Analysis'}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {analysis.graphType ? `${analysis.graphType} graph` : ''}
                      {analysis?.a4Scale?.xScale != null && analysis?.a4Scale?.yScale != null
                        ? ` • A4 scale X=${analysis.a4Scale.xScale}, Y=${analysis.a4Scale.yScale}`
                        : ''}
                    </p>
                  </div>

                  <button
                    onClick={handleSendToArduino}
                    className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    type="button"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send to Device</span>
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveView('graph')}
                    className={
                      `flex items-center space-x-2 px-3 py-2 rounded-md text-sm border ` +
                      (activeView === 'graph'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50')
                    }
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span>Graph</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveView('commands')}
                    className={
                      `flex items-center space-x-2 px-3 py-2 rounded-md text-sm border ` +
                      (activeView === 'commands'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50')
                    }
                  >
                    <Terminal className="h-4 w-4" />
                    <span>Commands</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveView('workings')}
                    className={
                      `flex items-center space-x-2 px-3 py-2 rounded-md text-sm border ` +
                      (activeView === 'workings'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50')
                    }
                  >
                    <span>Workings</span>
                  </button>
                </div>
              </div>
            )}

            {activeView === 'graph' && <GraphVisualization analysis={analysis} />}
            {activeView === 'commands' && <CommandsView commandText={commandPreview} />}
            {activeView === 'workings' && <WorkingsView analysis={analysis} />}

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Device Connection</h3>
                <span className="text-sm text-gray-600">{usingBluetooth ? 'Bluetooth' : 'Backend Serial'}</span>
              </div>
              <BluetoothConnect
                onConnected={() => { setArduinoConnected(true); setUsingBluetooth(true); }}
                onDisconnected={() => { setArduinoConnected(false); setUsingBluetooth(false); }}
              />
            </div>
          </div>
        </div>
      </main>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw]">
            <div className="h-full">
              <div className="flex items-center justify-between bg-white border-b border-gray-200 p-3">
                <div className="text-sm font-semibold text-gray-900">Menu</div>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-md hover:bg-gray-100"
                  aria-label="Close sidebar"
                >
                  <X className="h-5 w-5 text-gray-700" />
                </button>
              </div>
              <Sidebar
                history={history}
                activeHistoryId={activeHistoryId}
                onPickHistory={pickHistory}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const generateCommandPreview = (analysis) => {
  const commands = [];
  commands.push('INIT');
  commands.push(`SCALE ${analysis.a4Scale?.xScale || 1},${analysis.a4Scale?.yScale || 1}`);
  commands.push(`MOVE ${analysis.a4Scale?.origin?.x || 0},${analysis.a4Scale?.origin?.y || 0}`);
  commands.push('DRAW_AXES');
  commands.push('PEN_DOWN');
  
  if (analysis.plottingPoints && analysis.plottingPoints.length > 0) {
    analysis.plottingPoints.slice(0, 5).forEach(point => {
      commands.push(`MOVE ${point.x},${point.y}`);
    });
    if (analysis.plottingPoints.length > 5) {
      commands.push(`... ${analysis.plottingPoints.length - 5} more points`);
    }
  }
  
  commands.push('PEN_UP');
  commands.push('HOME');
  
  return commands.join('\n');
};

export default App;
