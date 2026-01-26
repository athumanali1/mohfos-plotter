import React from 'react';
import { History } from 'lucide-react';

const Sidebar = ({
  history,
  activeHistoryId,
  onPickHistory,
}) => {
  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">History</h2>
        <p className="text-sm text-gray-600 mt-1">Your recent questions</p>
      </div>

      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-3">
          <History className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-900">History</h3>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500">No history yet</p>
        ) : (
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => onPickHistory(item.id)}
                className={
                  `block w-full text-left text-sm px-2 py-2 rounded border ` +
                  (item.id === activeHistoryId
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                    : 'border-transparent hover:border-gray-200 hover:bg-gray-50 text-gray-700')
                }
                type="button"
              >
                <div className="font-medium truncate">{item.question}</div>
                <div className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 flex-1" />
    </div>
  );
};

export default Sidebar;
