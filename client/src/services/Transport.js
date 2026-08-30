// Transport layer: chooses between backend HTTP and Bluetooth Serial (HC-05/HC-06 via cordova-plugin-bluetooth-serial)

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const isBluetoothAvailable = () => typeof window !== 'undefined' && !!window.bluetoothSerial;

const isBluetoothConnected = () =>
  new Promise((resolve) => {
    if (!isBluetoothAvailable()) return resolve(false);
    window.bluetoothSerial.isConnected(
      () => resolve(true),
      () => resolve(false)
    );
  });

const writeBluetoothLine = (line) =>
  new Promise((resolve, reject) => {
    try {
      window.bluetoothSerial.write(line + "\n", resolve, reject);
    } catch (e) {
      reject(e);
    }
  });

// Resolve backend base URL (same logic as Api.js)
const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.API_BASE) return window.API_BASE;
  if (process.env.REACT_APP_API_BASE) return process.env.REACT_APP_API_BASE;
  return '';
};
const base = getBaseUrl();

const generateArduinoCommands = (data) => {
  const commands = [];
  
  // Initialize plotter
  commands.push('INIT');
  
  // Set scale for A4 paper
  const xScale = data?.a4Scale?.xScale ?? 1;
  const yScale = data?.a4Scale?.yScale ?? 1;
  commands.push(`SCALE ${xScale},${yScale}`);
  
  // Calculate axis endpoints based on ranges
  const xMin = data?.xRange?.min ?? -5;
  const xMax = data?.xRange?.max ?? 5;
  const yMin = data?.yRange?.min ?? -5;
  const yMax = data?.yRange?.max ?? 5;
  
  const originX = data?.a4Scale?.origin?.x ?? 0;
  const originY = data?.a4Scale?.origin?.y ?? 0;
  
  // --- DRAW VERTICAL Y-AXIS ---
  // Move to top of Y-axis (pen up)
  commands.push(`MOVE ${originX},${yMax}`);
  // Draw down to origin
  commands.push('PEN_DOWN');
  commands.push(`MOVE ${originX},${originY}`);
  // Continue to bottom if needed
  if (yMin < 0) {
    commands.push(`MOVE ${originX},${yMin}`);
  }
  commands.push('PEN_UP');
  
  // --- DRAW HORIZONTAL X-AXIS ---
  // Move to left of X-axis (pen up)
  commands.push(`MOVE ${xMin},${originY}`);
  // Draw right to origin
  commands.push('PEN_DOWN');
  commands.push(`MOVE ${originX},${originY}`);
  // Continue to right end
  commands.push(`MOVE ${xMax},${originY}`);
  commands.push('PEN_UP');
  
  // --- PLOT THE GRAPH CURVE ---
  // Move to first point (pen up)
  if (Array.isArray(data?.plottingPoints) && data.plottingPoints.length) {
    commands.push(`MOVE ${data.plottingPoints[0].x},${data.plottingPoints[0].y}`);
    // Draw the curve
    commands.push('PEN_DOWN');
    data.plottingPoints.forEach((p) => {
      if (typeof p?.x === 'number' && typeof p?.y === 'number') {
        commands.push(`MOVE ${p.x},${p.y}`);
      }
    });
  }
  
  // Handle shading if needed
  if (Array.isArray(data?.shadingRegions)) {
    data.shadingRegions.forEach((region) => {
      if (region?.type && Array.isArray(region?.bounds)) {
        commands.push(`SHADE ${region.type},${region.bounds.join(',')}`);
      }
    });
  }
  
  // Lift pen and return home
  commands.push('PEN_UP');
  commands.push('HOME');
  
  return commands;
};

const sendViaBluetooth = async (plottingData) => {
  const connected = await isBluetoothConnected();
  if (!connected) {
    return { success: false, error: 'Bluetooth device not connected' };
  }
  const commands = generateArduinoCommands(plottingData);
  let sent = 0;
  for (const cmd of commands) {
    await writeBluetoothLine(cmd);
    sent += 1;
    await delay(10); // small pacing to avoid buffer overflow
  }
  return { success: true, commandsSent: sent };
};

const sendViaBackend = async (plottingData) => {
  const response = await fetch(`${base}/api/send-to-arduino`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plottingData }),
  });
  const data = await response.json();
  if (!response.ok) return { success: false, error: data?.error || 'Backend error' };
  return { success: true, commandsSent: data?.commandsSent };
};

const Transport = {
  async sendPlottingData(plottingData) {
    try {
      if (isBluetoothAvailable() && (await isBluetoothConnected())) {
        return await sendViaBluetooth(plottingData);
      }
      return await sendViaBackend(plottingData);
    } catch (e) {
      return { success: false, error: String(e?.message || e) };
    }
  },
};

export default Transport;
