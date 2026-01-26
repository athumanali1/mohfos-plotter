import React from 'react';
import { Brain, Send } from 'lucide-react';

const QuestionInput = ({ question, setQuestion, onAnalyze, loading, showSamples = true }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onAnalyze();
  };

  const sampleQuestions = [
    "Plot y = 2x + 3 from x = -5 to x = 5",
    "Draw a parabola y = x² - 4",
    "Graph y = sin(x) from 0 to 2π",
    "Plot y = x³ - 2x² + x - 1",
    "Draw a circle x² + y² = 25"
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <Brain className="h-6 w-6 mr-2 text-indigo-600" />
        Graph Question
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
            Enter your graph question:
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., Plot y = 2x + 3 from x = -5 to x = 5"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="loading-spinner"></div>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Analyze & Generate Plot</span>
            </>
          )}
        </button>
      </form>

      {showSamples && (
        <div className="mt-6">
          <p className="text-sm text-gray-600 mb-2">Sample questions:</p>
          <div className="space-y-1">
            {sampleQuestions.map((sample, index) => (
              <button
                key={index}
                onClick={() => setQuestion(sample)}
                className="block w-full text-left text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                disabled={loading}
                type="button"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionInput;
