/*
 * moHFoS Plotter - Arduino Graph Drawing System
 * 
 * This Arduino code controls a physical plotter that draws graphs on A4 paper.
 * It receives commands from the web app via serial communication.
 * 
 * Hardware Requirements:
 * - Arduino Uno/Nano
 * - 2x Stepper motors (X and Y axis)
 * - 1x Servo motor (pen control)
 * - Stepper motor drivers (A4988 or similar)
 * - Power supply for motors
 * - Plotting mechanism (3D printer or custom design)
 */

#include <AccelStepper.h>
#include <Servo.h>
#include <SoftwareSerial.h>

// Pin definitions
#define X_STEP_PIN 2
#define X_DIR_PIN 3
#define Y_STEP_PIN 4
#define Y_DIR_PIN 5
#define PEN_SERVO_PIN 6
// Bluetooth module (HC-05/HC-06) pins (RX, TX)
#define BT_RX_PIN 10  // Arduino receives on this pin (connect to BT TX)
#define BT_TX_PIN 11  // Arduino transmits on this pin (connect to BT RX)

// A4 Paper dimensions (in steps, adjust based on your mechanics)
#define A4_WIDTH_STEPS 8000   // 210mm
#define A4_HEIGHT_STEPS 11300 // 297mm

// Plotting configuration
#define PEN_UP_POSITION 90    // Servo angle for pen up
#define PEN_DOWN_POSITION 45  // Servo angle for pen down
#define STEPS_PER_MM 40       // Adjust based on your stepper motor and lead screw

// Create stepper objects
AccelStepper xStepper(AccelStepper::DRIVER, X_STEP_PIN, X_DIR_PIN);
AccelStepper yStepper(AccelStepper::DRIVER, Y_STEP_PIN, Y_DIR_PIN);

// Create servo object
Servo penServo;

// Bluetooth serial interface (classic SPP)
SoftwareSerial BTSerial(BT_RX_PIN, BT_TX_PIN);

// Global variables
float xScale = 1.0;
float yScale = 1.0;
int originX = A4_WIDTH_STEPS / 2;
int originY = A4_HEIGHT_STEPS / 2;
bool penDown = false;
String inputString = "";
boolean stringComplete = false;

void setup() {
  Serial.begin(9600);
  BTSerial.begin(9600);
  
  // Initialize stepper motors
  xStepper.setMaxSpeed(1000);
  xStepper.setAcceleration(500);
  yStepper.setMaxSpeed(1000);
  yStepper.setAcceleration(500);
  
  // Initialize servo
  penServo.attach(PEN_SERVO_PIN);
  penUp();
  
  // Home the plotter (move to origin)
  home();
  
  Serial.println("moHFoS Plotter Ready");
  Serial.println("Waiting for commands (Bluetooth SPP @9600 on pins 10/11)...");
  BTSerial.println("moHFoS Plotter Ready");
  BTSerial.println("Waiting for commands...");
}

void loop() {
  // Check for incoming serial data
  if (BTSerial.available()) {
    char inChar = (char)BTSerial.read();
    if (inChar == '\n') {
      stringComplete = true;
    } else {
      inputString += inChar;
    }
  }
  
  // Process complete commands
  if (stringComplete) {
    processCommand(inputString);
    inputString = "";
    stringComplete = false;
  }
  
  // Run stepper motors
  xStepper.run();
  yStepper.run();
}

void processCommand(String command) {
  command.trim();
  Serial.println("Processing: " + command);
  BTSerial.println("Processing: " + command);
  
  if (command == "INIT") {
    initialize();
  } else if (command == "HOME") {
    home();
  } else if (command == "DRAW_AXES") {
    drawAxes();
  } else if (command == "PEN_UP") {
    penUp();
  } else if (command == "PEN_DOWN") {
    penDown();
  } else if (command.startsWith("MOVE")) {
    processMoveCommand(command);
  } else if (command.startsWith("SCALE")) {
    processScaleCommand(command);
  } else if (command.startsWith("SHADE")) {
    processShadeCommand(command);
  } else {
    Serial.println("Unknown command: " + command);
    BTSerial.println("Unknown command: " + command);
  }
}

void initialize() {
  Serial.println("Initializing plotter...");
  BTSerial.println("Initializing plotter...");
  penUp();
  home();
  Serial.println("Plotter initialized");
  BTSerial.println("Plotter initialized");
}

void home() {
  Serial.println("Homing plotter...");
  BTSerial.println("Homing plotter...");
  xStepper.moveTo(originX);
  yStepper.moveTo(originY);
  while (xStepper.distanceToGo() != 0 || yStepper.distanceToGo() != 0) {
    xStepper.run();
    yStepper.run();
  }
  Serial.println("Plotter homed");
  BTSerial.println("Plotter homed");
}

void drawAxes() {
  Serial.println("Drawing axes...");
  BTSerial.println("Drawing axes...");
  
  // Draw X axis
  penUp();
  moveTo(0, originY);
  penDown();
  moveTo(A4_WIDTH_STEPS, originY);
  penUp();
  
  // Draw Y axis
  moveTo(originX, 0);
  penDown();
  moveTo(originX, A4_HEIGHT_STEPS);
  penUp();
  
  // Return to origin
  moveTo(originX, originY);
  
  Serial.println("Axes drawn");
  BTSerial.println("Axes drawn");
}

void processMoveCommand(String command) {
  // Format: MOVE x,y
  int commaIndex = command.indexOf(',');
  if (commaIndex == -1) return;
  
  String xStr = command.substring(5, commaIndex);
  String yStr = command.substring(commaIndex + 1);
  
  float x = xStr.toFloat();
  float y = yStr.toFloat();
  
  // Convert to plotter coordinates
  int plotterX = originX + (x * xScale * STEPS_PER_MM);
  int plotterY = originY - (y * yScale * STEPS_PER_MM); // Invert Y axis
  
  moveTo(plotterX, plotterY);
}

void processScaleCommand(String command) {
  // Format: SCALE xScale,yScale
  int commaIndex = command.indexOf(',');
  if (commaIndex == -1) return;
  
  String xScaleStr = command.substring(6, commaIndex);
  String yScaleStr = command.substring(commaIndex + 1);
  
  xScale = xScaleStr.toFloat();
  yScale = yScaleStr.toFloat();
  
  Serial.println("Scale set to X:" + String(xScale) + " Y:" + String(yScale));
  BTSerial.println("Scale set to X:" + String(xScale) + " Y:" + String(yScale));
}

void processShadeCommand(String command) {
  // Format: SHADE type,bound1,bound2,...
  Serial.println("Shading not implemented yet: " + command);
  BTSerial.println("Shading not implemented yet: " + command);
  // TODO: Implement shading functionality
}

void moveTo(int x, int y) {
  xStepper.moveTo(x);
  yStepper.moveTo(y);
  while (xStepper.distanceToGo() != 0 || yStepper.distanceToGo() != 0) {
    xStepper.run();
    yStepper.run();
  }
}

void penUp() {
  penServo.write(PEN_UP_POSITION);
  penDown = false;
  delay(100);
}

void penDown() {
  penServo.write(PEN_DOWN_POSITION);
  penDown = true;
  delay(100);
}

// Utility function to draw a line between two points
void drawLine(float x1, float y1, float x2, float y2) {
  penUp();
  moveTo(originX + (x1 * xScale * STEPS_PER_MM), originY - (y1 * yScale * STEPS_PER_MM));
  penDown();
  moveTo(originX + (x2 * xScale * STEPS_PER_MM), originY - (y2 * yScale * STEPS_PER_MM));
  penUp();
}

// Utility function to draw a rectangle (for shading)
void drawRectangle(float x1, float y1, float x2, float y2) {
  penUp();
  moveTo(originX + (x1 * xScale * STEPS_PER_MM), originY - (y1 * yScale * STEPS_PER_MM));
  penDown();
  moveTo(originX + (x2 * xScale * STEPS_PER_MM), originY - (y1 * yScale * STEPS_PER_MM));
  moveTo(originX + (x2 * xScale * STEPS_PER_MM), originY - (y2 * yScale * STEPS_PER_MM));
  moveTo(originX + (x1 * xScale * STEPS_PER_MM), originY - (y2 * yScale * STEPS_PER_MM));
  moveTo(originX + (x1 * xScale * STEPS_PER_MM), originY - (y1 * yScale * STEPS_PER_MM));
  penUp();
}
