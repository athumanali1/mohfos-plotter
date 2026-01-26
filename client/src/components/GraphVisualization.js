import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const GraphVisualization = ({ analysis }) => {
  if (!analysis || !analysis.plottingPoints) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Graph Visualization</h3>
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-md">
          <p className="text-gray-500">No graph data to display</p>
        </div>
      </div>
    );
  }

  // Prepare data for Chart.js
  const labels = analysis.plottingPoints.map(point => point.x.toFixed(2));
  const data = analysis.plottingPoints.map(point => point.y.toFixed(2));

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: analysis.equation || 'Graph',
        data: data,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 1,
        pointHoverRadius: 4,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${analysis.graphType} Graph - ${analysis.equation}`,
      },
    },
    scales: {
      x: {
        type: 'linear',
        position: 'center',
        min: analysis.xRange?.min || -10,
        max: analysis.xRange?.max || 10,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        title: {
          display: true,
          text: 'X Axis'
        }
      },
      y: {
        type: 'linear',
        position: 'center',
        min: analysis.yRange?.min || -10,
        max: analysis.yRange?.max || 10,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        title: {
          display: true,
          text: 'Y Axis'
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Graph Visualization</h3>
        <div className="text-sm text-gray-600">
          Scale: X={analysis.scale?.x || 1}, Y={analysis.scale?.y || 1}
        </div>
      </div>
      
      <div className="h-96">
        <Line data={chartData} options={options} />
      </div>
      
      {analysis.shadingRegions && analysis.shadingRegions.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm font-medium text-blue-900">Shading Regions:</p>
          <ul className="text-sm text-blue-700 mt-1">
            {analysis.shadingRegions.map((region, index) => (
              <li key={index}>
                {region.type} {region.bounds.join(' to ')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GraphVisualization;
