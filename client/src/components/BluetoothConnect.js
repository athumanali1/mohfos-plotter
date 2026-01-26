import React, { useEffect, useMemo, useRef, useState } from 'react';

// Cordova Classic Bluetooth Serial plugin interface (if present)
// window.bluetoothSerial API (from cordova-plugin-bluetooth-serial)
// Methods used: isEnabled, enable, list, connect, disconnect, isConnected, write, subscribe

const BluetoothConnect = ({ onConnected, onDisconnected }) => {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectingTo, setConnectingTo] = useState(null);
  const [connected, setConnected] = useState(false);
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState('');

  const connectInFlightRef = useRef(false);

  const bt = typeof window !== 'undefined' ? window.bluetoothSerial : null;

  const lastDeviceId = useMemo(() => {
    try {
      return localStorage.getItem('mohfos_bt_last_device') || '';
    } catch (_) {
      return '';
    }
  }, []);

  useEffect(() => {
    setAvailable(!!bt);
    if (bt) {
      bt.isEnabled(
        () => setEnabled(true),
        () => setEnabled(false)
      );
      bt.isConnected(
        () => { setConnected(true); onConnected && onConnected(); },
        () => { setConnected(false); onDisconnected && onDisconnected(); }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnable = () => {
    if (!bt) return;
    bt.enable(
      () => setEnabled(true),
      (err) => setError(String(err))
    );
  };

  const handleList = () => {
    if (!bt) return;
    bt.list(
      (list) => setDevices(list || []),
      (err) => setError(String(err))
    );
  };

  const handleConnect = (address) => {
    if (!bt || !address) return;
    if (connectInFlightRef.current) return;
    if (connected) return;
    connectInFlightRef.current = true;
    setConnecting(true);
    setConnectingTo(address);
    setError('');

    // Ensure we don't have a previous dangling connection attempt
    try {
      bt.disconnect(
        () => {
          // ignore
        },
        () => {
          // ignore
        }
      );
    } catch (_) {
      // ignore
    }

    bt.connect(
      address,
      () => {
        try {
          localStorage.setItem('mohfos_bt_last_device', address);
        } catch (_) {
          // ignore
        }
        setConnecting(false);
        setConnectingTo(null);
        connectInFlightRef.current = false;
        setConnected(true);
        onConnected && onConnected();
      },
      (err) => {
        setConnecting(false);
        setConnectingTo(null);
        connectInFlightRef.current = false;
        setConnected(false);
        setError(String(err));
      }
    );
  };

  const handleDisconnect = () => {
    if (!bt) return;
    bt.disconnect(
      () => {
        setConnected(false);
        setConnecting(false);
        setConnectingTo(null);
        connectInFlightRef.current = false;
        onDisconnected && onDisconnected();
      },
      (err) => setError(String(err))
    );
  };

  return (
    <div className="space-y-3">
      {!available && (
        <div className="text-sm text-gray-600">
          Bluetooth serial not available in this environment. Use Android build (Capacitor/Cordova) with classic Bluetooth plugin to enable direct HC-05 connection.
        </div>
      )}

      {available && (
        <>
          <div className="flex items-center space-x-2 text-sm">
            <span className="font-medium">Bluetooth:</span>
            <span className={enabled ? 'text-green-600' : 'text-red-600'}>
              {enabled ? 'Enabled' : 'Disabled'}
            </span>
            <span className={connected ? 'text-green-600' : 'text-red-600'}>
              • {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {!enabled && (
            <button onClick={handleEnable} className="bg-indigo-600 text-white px-3 py-2 rounded-md text-sm">
              Enable Bluetooth
            </button>
          )}

          <div className="space-y-2">
            <button onClick={handleList} className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm">
              Scan Paired Devices
            </button>

            {lastDeviceId && !connected && (
              <button
                onClick={() => handleConnect(lastDeviceId)}
                disabled={connecting}
                className="bg-indigo-600 text-white px-3 py-2 rounded-md text-sm disabled:bg-gray-400"
                type="button"
              >
                {connecting && connectingTo === lastDeviceId ? 'Reconnecting...' : 'Reconnect last device'}
              </button>
            )}

            <div className="grid grid-cols-1 gap-2">
              {devices.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                  <div className="text-sm">
                    <div className="font-medium">{d.name || 'Unknown'}</div>
                    <div className="text-gray-600">{d.id}</div>
                  </div>
                  <button
                    disabled={connecting && connectingTo !== d.id}
                    onClick={() => handleConnect(d.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded-md text-sm disabled:bg-gray-400"
                    type="button"
                  >
                    {connecting && connectingTo === d.id ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {connected && (
            <button onClick={handleDisconnect} className="bg-red-600 text-white px-3 py-2 rounded-md text-sm">
              Disconnect
            </button>
          )}
        </>
      )}

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}
    </div>
  );
};

export default BluetoothConnect;
