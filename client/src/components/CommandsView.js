import React from 'react';

const CommandsView = ({ commandText }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Arduino Commands</h3>
      <div className="bg-gray-100 rounded-md p-4 max-h-[28rem] overflow-y-auto">
        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
          {commandText || 'No commands generated yet'}
        </pre>
      </div>
    </div>
  );
};

export default CommandsView;
