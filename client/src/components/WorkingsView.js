import React from 'react';
import PlottingDetails from './PlottingDetails';

const renderWorkings = (text) => {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');

  const blocks = [];
  let paragraph = [];
  let list = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ type: 'p', text: paragraph.join(' ').trim() });
    paragraph = [];
  };

  const flushList = () => {
    if (!list || list.items.length === 0) {
      list = null;
      return;
    }
    blocks.push(list);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#+)\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h', level: Math.min(3, headingMatch[1].length), text: headingMatch[2].trim() });
      continue;
    }

    const numberedMatch = line.match(/^\d+\.|^\d+\)\s+/);
    const bulletMatch = line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ');

    if (numberedMatch) {
      flushParagraph();
      if (!list || list.type !== 'ol') {
        flushList();
        list = { type: 'ol', items: [] };
      }
      list.items.push(line.replace(/^\d+\.|^\d+\)\s+/, '').trim());
      continue;
    }

    if (bulletMatch) {
      flushParagraph();
      if (!list || list.type !== 'ul') {
        flushList();
        list = { type: 'ul', items: [] };
      }
      list.items.push(line.replace(/^[-*•]\s+/, '').trim());
      continue;
    }

    if (line.endsWith(':') && line.length <= 80) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h', level: 3, text: line.slice(0, -1).trim() });
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return (
    <div className="space-y-3">
      {blocks.map((b, idx) => {
        if (b.type === 'h') {
          const cls =
            b.level === 1
              ? 'text-base font-semibold text-gray-900'
              : b.level === 2
                ? 'text-sm font-semibold text-gray-900'
                : 'text-sm font-semibold text-gray-800';
          return (
            <div key={idx} className={cls}>
              {b.text}
            </div>
          );
        }
        if (b.type === 'ul') {
          return (
            <ul key={idx} className="list-disc pl-5 text-sm text-gray-800 space-y-1">
              {b.items.map((it, j) => (
                <li key={j}>{it}</li>
              ))}
            </ul>
          );
        }
        if (b.type === 'ol') {
          return (
            <ol key={idx} className="list-decimal pl-5 text-sm text-gray-800 space-y-1">
              {b.items.map((it, j) => (
                <li key={j}>{it}</li>
              ))}
            </ol>
          );
        }
        return (
          <div key={idx} className="text-sm text-gray-800 leading-relaxed">
            {b.text}
          </div>
        );
      })}
    </div>
  );
};

const WorkingsView = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workings</h3>
        <p className="text-gray-600">No analysis yet.</p>
      </div>
    );
  }

  const explanation = analysis.workings || analysis.explanation || analysis.reasoning;
  const tables = Array.isArray(analysis.tables) ? analysis.tables : [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workings</h3>
        {explanation ? (
          <div className="bg-gray-50 rounded-md p-4">
            {renderWorkings(explanation)}
          </div>
        ) : (
          <p className="text-gray-600 text-sm">
            No explanation returned by the AI. (Optional) We can enhance the backend prompt to always include it.
          </p>
        )}
      </div>

      {tables.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tables</h3>
          <div className="space-y-6">
            {tables.map((t, idx) => {
              const columns = Array.isArray(t?.columns) ? t.columns : [];
              const rows = Array.isArray(t?.rows) ? t.rows : [];

              return (
                <div key={idx} className="space-y-3">
                  {t?.title ? (
                    <div className="text-sm font-semibold text-gray-900">{t.title}</div>
                  ) : null}

                  <div className="overflow-x-auto border border-gray-200 rounded-md">
                    <table className="min-w-full text-sm">
                      {columns.length > 0 && (
                        <thead className="bg-gray-50">
                          <tr>
                            {columns.map((c, j) => (
                              <th
                                key={j}
                                className="text-left font-semibold text-gray-700 px-3 py-2 border-b border-gray-200 whitespace-nowrap"
                              >
                                {String(c)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {rows.map((r, j) => {
                          const cells = Array.isArray(r) ? r : [r];
                          return (
                            <tr key={j} className={j % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                              {cells.map((cell, k) => (
                                <td key={k} className="px-3 py-2 border-b border-gray-100 whitespace-nowrap">
                                  {cell == null ? '' : String(cell)}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <PlottingDetails analysis={analysis} />
    </div>
  );
};

export default WorkingsView;
