import { useEffect, useReducer, useRef, useState } from "react";
import { MODES, PAN_LIMIT } from "./constants";

import undo from "./assets/undo.svg";
import redo from "./assets/redo.svg";
import move from "./assets/move.svg";

let lastPath = [];

const Canvas = ({ settings, ...rest }) => {
  const [drawing, setDrawing] = useState(false);
  const [, render] = useReducer((prev) => !prev, false);
  const canvas = useRef(null);
  const context = useRef(null);
  const history = useRef([]);
  const redoHistory = useRef([]);
  const moving = useRef(false);

  const prevent = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onPointerDown = (e) => {
    prevent(e);
    settings.current.coords = [e.clientX, e.clientY];
    if (settings.current.mode === MODES.PAN) {
      moving.current = true;
      return;
    }
    setDrawing(true);
    settings.current.draw = true;
    lastPath = [];
  };

  const onPointerUp = (e) => {
    prevent(e);
    if (settings.current.mode === MODES.PAN) {
      moving.current = false;
      return;
    }
    setDrawing(false);
    settings.current.draw = false;
    history.current.push([settings.current.mode, lastPath]);
    redoHistory.current = [];
    lastPath = [];
  };

  const onCanvasMove = (e) => {
    const [x1, y1] = settings.current.coords;
    const { clientX: x2, clientY: y2 } = e;
    let dx = x2 - x1;
    let dy = y2 - y1;
    const ctx = getContext();
    const { e: tdx, f: tdy } = ctx.getTransform();
    const ntdx = Math.min(Math.max(0, tdx + dx), PAN_LIMIT - rest.width);
    const ntdy = Math.min(Math.max(0, tdy + dy), PAN_LIMIT - rest.height);
    ctx.setTransform(1, 0, 0, 1, ntdx, ntdy);
    drawCanvas();
    settings.current.coords = [x2, y2];
  };
  const onPointerMove = (e) => {
    prevent(e);
    if (moving.current) return onCanvasMove(e);
    if (!settings.current.draw) return;
    const point = getPoints(e);
    draw(settings.current.mode, point);
  };

  const draw = (mode, point) => {
    switch (mode) {
      case MODES.LINE:
        drawLine(point);
        break;
      case MODES.RECT:
        drawRect(point);
        break;
      default:
        return;
    }
  };

  const getContext = () => {
    if (!context.current) {
      context.current = canvas.current.getContext("2d");
    }
    const ctx = context.current;
    ctx.fillStyle = settings.current.color;
    ctx.lineWidth = settings.current.stroke;
    ctx.lineCap = "round";
    return ctx;
  };

  const getPoints = (e) => {
    const ctx = getContext();
    const { e: dx, f: dy } = ctx.getTransform();
    console.log(dx, dy);
    const rect = canvas.current.getBoundingClientRect();
    return [e.clientX - rect.x - dx, e.clientY - rect.y - dy];
  };

  const drawRect = (e) => {};

  const drawLine = (point) => {
    const ctx = getContext();
    const [x, y] = point;
    const [lx, ly] = lastPath[lastPath.length - 1] || [x, y];
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPath.push([x, y]);
  };

  const clearCanvas = () => {
    const ctx = getContext();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, PAN_LIMIT, PAN_LIMIT);
    ctx.restore();
  };

  const drawCanvas = (e) => {
    render();
    clearCanvas();
    history.current.forEach(([mode, path]) => {
      lastPath = [];
      path.forEach((p) => {
        draw(mode, p);
      });
      lastPath = [];
    });
  };

  const undoCanvas = (e) => {
    prevent(e);
    if (history.current.length === 0) return;
    redoHistory.current.push(history.current.pop());
    drawCanvas();
  };

  const redoCanvas = (e) => {
    prevent(e);
    if (redoHistory.current.length === 0) return;
    history.current.push(redoHistory.current.pop());
    drawCanvas();
  };

  const moveCanvas = () => {
    if (settings.current.mode === MODES.PAN) {
      settings.current.mode = MODES.LINE;
    } else {
      settings.current.mode = MODES.PAN;
    }
    render();
  };

  useEffect(() => {
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointermove", onPointerMove);
    getContext().setTransform(1, 0, 0, 1, PAN_LIMIT / 2, PAN_LIMIT / 2);
    console.log(getContext());
    return () => {
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointermove", onPointerMove);
    };
  }, [canvas.current]);

  const getFullCanvasImage = () => {
    const newCanvas = document.createElement("canvas");
    newCanvas.width = 200;
    newCanvas.height = 200;
    if (canvas.current) {
      const destCtx = newCanvas.getContext("2d");
      const ctx = getContext();
      ctx.save();
      ctx.setTransform(0.01, 0, 0, 0.01, 0, 0);
      destCtx.drawImage(canvas.current, 0, 0);
      ctx.restore()
    }
    return newCanvas.toDataURL("image/png");
  };

  return (
    <>
      <canvas
        ref={canvas}
        {...rest}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className={settings.current.mode === MODES.PAN ? "moving" : "drawing"}
      />
      <div
        className="menu"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        aria-disabled={drawing}
      >
        <img
          className="preview"
          alt="preview"
          width={50}
          height={50}
          src={getFullCanvasImage()}
        />
        <button
          onClick={moveCanvas}
          aria-pressed={settings.current.mode === MODES.PAN}
        >
          <img src={move} alt="move" title="move" />
        </button>
        <button onClick={undoCanvas} disabled={history.current.length === 0}>
          <img src={undo} alt="undo" title="undo" />
        </button>
        <button
          onClick={redoCanvas}
          disabled={redoHistory.current.length === 0}
        >
          <img src={redo} alt="redo" title="red" />
        </button>
      </div>
    </>
  );
};

export default Canvas;
