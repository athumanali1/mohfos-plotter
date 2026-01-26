import React from 'react';
import { Wifi, WifiOff, Cpu } from 'lucide-react';

const ArduinoStatus = ({ connected }) => {
  return (
    <div className="flex items-center space-x-2">
      <Cpu className="h-5 w-5 text-gray-600" />
      <div className="flex items-center space-x-1">
        {connected ? (
          <>
            <Wifi className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-600">Arduino Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-600">Arduino Disconnected</span>
          </>
        )}
      </div>
    </div>
  );
};

export default ArduinoStatus;
