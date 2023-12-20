import Canvas from "./Canvas";
import "./App.css";
import { useRef } from "react";
import { MODES } from "./constants";
import { useWindowSize } from "./hooks";

function App() {
  const settings = useRef({
    stroke: 3,
    color: "#000",
    mode: MODES.PEN,
  });

  const size = useWindowSize();

  return (
    <div className="app">
      <div className="canvas-container">
        <Canvas {...size} settings={settings} />
      </div>
    </div>
  );
}

export default App;
