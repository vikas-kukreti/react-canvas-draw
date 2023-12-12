import Canvas from "./Canvas";
import "./App.css";
import { useRef } from "react";
import { MODES } from "./constants";

function App() {
  const settings = useRef({
    stroke: 3,
    color: "#000",
    mode: MODES.LINE,
    draw: false,
    history: [],
    coords: [0,0],
  });
  const size = Math.min(window.innerHeight, window.innerWidth);
  return (
    <div className="app">
      <div className="canvas-container">
        <Canvas height={size} width={size} settings={settings} />
      </div>
    </div>
  );
}

export default App;
