# moHFoS Plotter - AI-Integrated Graph Plotting System

An innovative web application that combines AI analysis with physical graph plotting using Arduino. The system interprets mathematical graph questions, generates optimal plotting data for A4 paper, and controls an Arduino-based plotter to draw graphs physically.

## Features

- **AI-Powered Analysis**: Uses OpenAI API to interpret graph questions and generate mathematical equations
- **A4 Paper Optimization**: Automatically calculates optimal scale for A4 paper dimensions (210mm x 297mm)
- **Real-time Visualization**: Interactive graph preview using Chart.js
- **Arduino Integration**: Sends plotting commands to Arduino for physical graph drawing
- **Shading Support**: Handles shading regions for inequalities and area calculations
- **Multiple Graph Types**: Supports linear, quadratic, cubic, trigonometric, and other mathematical functions

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │   Node.js       │    │   Arduino       │
│   (React)       │◄──►│   Backend       │◄──►│   Plotter       │
│                 │    │                 │    │                 │
│ • Question Input│    │ • AI Integration│    │ • Stepper Motors│
│ • Graph Preview │    │ • Serial Comm   │    │ • Pen Control   │
│ • Plotting Data │    │ • Command Gen   │    │ • A4 Drawing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Arduino IDE
- OpenAI API key
- Arduino hardware (Uno/Nano recommended)
- Stepper motors and drivers
- Servo motor for pen control

### Backend Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   ARDUINO_PORT=COM3  # Adjust for your system
   BAUD_RATE=9600
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Navigate to client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`

### Arduino Setup

1. Open `arduino/graph_plotter.ino` in Arduino IDE
2. Install the AccelStepper library:
   - Sketch → Include Library → Manage Libraries
   - Search for "AccelStepper" and install
3. Configure pin definitions in the code if needed
4. Upload the code to your Arduino

## Hardware Requirements

### Arduino Components
- Arduino Uno/Nano or compatible
- 2x NEMA17 stepper motors (X and Y axis)
- 2x A4988 stepper motor drivers
- 1x SG90 servo motor (pen control)
- Power supply (12V recommended for steppers)
- Plotting mechanism (3D printer or custom)

### Wiring Diagram
```
Arduino Uno:
├── Pin 2 → X-STEP
├── Pin 3 → X-DIR
├── Pin 4 → Y-STEP
├── Pin 5 → Y-DIR
├── Pin 6 → Servo Signal
├── 5V → Servo Power
├── GND → Common Ground
└── VIN → Motor Power (12V)
```

## Usage

1. **Enter a Graph Question**: Type or select a sample question like "Plot y = 2x + 3 from x = -5 to x = 5"

2. **AI Analysis**: The system analyzes the question and generates:
   - Mathematical equation
   - Plotting points
   - Optimal scale for A4 paper
   - Shading instructions if needed

3. **Preview Graph**: View the generated graph in the interactive visualization

4. **Send to Arduino**: Click "Send to Arduino" to transmit plotting commands

5. **Physical Drawing**: The Arduino plotter draws the graph on A4 paper

## API Endpoints

### POST /api/analyze
Analyzes a graph question using AI.

**Request:**
```json
{
  "question": "Plot y = x² - 4"
}
```

**Response:**
```json
{
  "graphType": "quadratic",
  "equation": "y = x^2 - 4",
  "xRange": {"min": -5, "max": 5},
  "yRange": {"min": -4, "max": 21},
  "scale": {"x": 1, "y": 1},
  "plottingPoints": [{"x": -5, "y": 21}, ...],
  "a4Scale": {"xScale": 20, "yScale": 15, "origin": {"x": 105, "y": 148}}
}
```

### POST /api/send-to-arduino
Sends plotting data to Arduino.

**Request:**
```json
{
  "plottingData": {
    "a4Scale": {...},
    "plottingPoints": [...],
    "shadingRegions": [...]
  }
}
```

## Arduino Command Protocol

The system sends simple text commands to Arduino:

- `INIT` - Initialize plotter
- `HOME` - Move to origin position
- `SCALE x,y` - Set plotting scale
- `MOVE x,y` - Move to coordinates
- `DRAW_AXES` - Draw X and Y axes
- `PEN_UP` - Lift pen
- `PEN_DOWN` - Lower pen
- `SHADE type,bounds` - Shade region

## Sample Questions

- "Plot y = 2x + 3 from x = -5 to x = 5"
- "Draw a parabola y = x² - 4"
- "Graph y = sin(x) from 0 to 2π"
- "Plot y = x³ - 2x² + x - 1"
- "Draw a circle x² + y² = 25"
- "Shade the area where y > x²"

## Troubleshooting

### Common Issues

1. **Arduino Not Connecting**
   - Check COM port in `.env` file
   - Verify Arduino is powered and connected
   - Check baud rate matches Arduino code

2. **AI Analysis Failing**
   - Verify OpenAI API key is valid
   - Check internet connection
   - Ensure API quota is available

3. **Graph Not Drawing Correctly**
   - Verify stepper motor wiring
   - Check power supply voltage
   - Adjust `STEPS_PER_MM` in Arduino code

4. **Tailwind CSS Not Working**
   - Run `npm install` in client directory
   - Restart development server

## Development

### Project Structure
```
mohfos-plotter/
├── server.js              # Node.js backend
├── package.json           # Backend dependencies
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.js        # Main application
│   │   └── index.js      # Entry point
│   └── package.json      # Frontend dependencies
├── arduino/              # Arduino code
│   └── graph_plotter.ino # Plotter firmware
└── README.md            # This file
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check troubleshooting section
- Review hardware requirements

---

**moHFoS Plotter** - Transforming digital graphs into physical art through AI and robotics!
