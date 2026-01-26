import React from 'react';
import { Grid, Ruler, MapPin } from 'lucide-react';

const PlottingDetails = ({ analysis }) => {
  if (!analysis) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Grid className="h-5 w-5 mr-2 text-indigo-600" />
        Plotting Details
      </h3>
      
      <div className="space-y-4">
        {/* A4 Scale Information */}
        <div className="border-l-4 border-indigo-500 pl-4">
          <h4 className="font-medium text-gray-900 flex items-center mb-2">
            <Ruler className="h-4 w-4 mr-1" />
            A4 Paper Scale
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">X Scale:</span>
              <span className="ml-2 font-mono">{analysis.a4Scale?.xScale || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Y Scale:</span>
              <span className="ml-2 font-mono">{analysis.a4Scale?.yScale || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Origin X:</span>
              <span className="ml-2 font-mono">{analysis.a4Scale?.origin?.x || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Origin Y:</span>
              <span className="ml-2 font-mono">{analysis.a4Scale?.origin?.y || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Plotting Points */}
        <div className="border-l-4 border-green-500 pl-4">
          <h4 className="font-medium text-gray-900 flex items-center mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            Plotting Points ({analysis.plottingPoints?.length || 0})
          </h4>
          <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-md p-3">
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {analysis.plottingPoints?.slice(0, 15).map((point, index) => (
                <div key={index} className="text-gray-700">
                  ({point.x?.toFixed(2)}, {point.y?.toFixed(2)})
                </div>
              ))}
            </div>
            {analysis.plottingPoints?.length > 15 && (
              <p className="text-xs text-gray-500 mt-2">
                ... and {analysis.plottingPoints.length - 15} more points
              </p>
            )}
          </div>
        </div>

        {/* Range Information */}
        <div className="border-l-4 border-blue-500 pl-4">
          <h4 className="font-medium text-gray-900 mb-2">Graph Range</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">X Range:</span>
              <span className="ml-2 font-mono">
                [{analysis.xRange?.min || 'N/A'}, {analysis.xRange?.max || 'N/A'}]
              </span>
            </div>
            <div>
              <span className="text-gray-600">Y Range:</span>
              <span className="ml-2 font-mono">
                [{analysis.yRange?.min || 'N/A'}, {analysis.yRange?.max || 'N/A'}]
              </span>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {analysis.shadingRegions && analysis.shadingRegions.length > 0 && (
          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-medium text-gray-900 mb-2">Shading Instructions</h4>
            <div className="space-y-1 text-sm">
              {analysis.shadingRegions.map((region, index) => (
                <div key={index} className="text-gray-700">
                  <span className="font-medium">Region {index + 1}:</span> {region.type} between {region.bounds?.join(' and ')}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlottingDetails;
