import { useEffect, useReducer, useRef, useState } from "react";
import { MODES, PAN_LIMIT } from "./constants";

let lastPath = [];

const Canvas = ({ settings, ...rest }) => {
  const width = Math.min(rest.width, PAN_LIMIT);
  const height = Math.min(rest.height, PAN_LIMIT);
  const [drawing, setDrawing] = useState(false);
  const [, render] = useReducer((prev) => !prev, false);
  const canvas = useRef(null);
  const context = useRef(null);
  const preview = useRef(null);
  const draw = useRef(false);
  const coords = useRef([0, 0]);
  const history = useRef([]);
  const redoHistory = useRef([]);
  const moving = useRef(false);
  const importInput = useRef(null);

  const prevent = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onPointerDown = (e) => {
    prevent(e);
    getContext(settings.current);
    coords.current = [e.clientX, e.clientY];
    if (settings.current.mode === MODES.PAN) {
      moving.current = true;
      return;
    }
    setDrawing(true);
    draw.current = true;
    lastPath = [];
  };

  const onPointerUp = (e) => {
    prevent(e);
    if (settings.current.mode === MODES.PAN) {
      moving.current = false;
      return;
    }
    setDrawing(false);
    draw.current = false;
    history.current.push({
      ...settings.current,
      path: lastPath,
    });
    redoHistory.current = [];
    lastPath = [];
  };

  const getPreviewActiveStyles = () => {
    const styles = {
      width: (width * 100) / PAN_LIMIT + "%",
      height: (height * 100) / PAN_LIMIT + "%",
    };
    if (!context.current) return styles;
    const { e, f } = getContext().getTransform();
    styles.left = (100 - e * 100) / PAN_LIMIT + "%";
    styles.top = (100 - f * 100) / PAN_LIMIT + "%";
    return styles;
  };

  const updatePreview = () => {
    if (preview.current) {
      const style = getPreviewActiveStyles();
      preview.current.style.left = style.left;
      preview.current.style.top = style.top;
    }
  };

  const onCanvasMove = (e, ctx) => {
    const [x1, y1] = coords.current;
    const { clientX: x2, clientY: y2 } = e;
    let dx = x2 - x1;
    let dy = y2 - y1;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    const { e: tdx, f: tdy } = ctx.getTransform();
    const ntdx = Math.min(Math.max(-(PAN_LIMIT - width), tdx + dx), 0);
    const ntdy = Math.min(Math.max(-(PAN_LIMIT - height), tdy + dy), 0);
    ctx.setTransform(1, 0, 0, 1, ntdx, ntdy);
    drawCanvas(ctx);
    coords.current = [x2, y2];
    updatePreview();
  };

  const onPointerMove = (e) => {
    prevent(e);
    if (moving.current) return onCanvasMove(e, context.current);
    if (!draw.current) return;
    const point = getPoints(e, context.current);
    drawModes(settings.current.mode, point, context.current);
  };

  const drawModes = (mode, point, ctx) => {
    switch (mode) {
      case MODES.LINE:
        drawLine(point, ctx);
        break;
      case MODES.RECT:
        drawRect(point, ctx);
        break;
      default:
        return;
    }
  };

  const getContext = (config, ctx) => {
    if (!context.current) {
      context.current = canvas.current.getContext("2d");
    }
    if (!ctx) ctx = context.current;
    if (config) {
      ctx.strokeStyle = config.color;
      ctx.lineWidth = config.stroke;
      ctx.lineCap = "round";
    }
    return ctx;
  };

  const getPoints = (e, ctx) => {
    const { e: dx, f: dy } = ctx.getTransform();
    const rect = canvas.current.getBoundingClientRect();
    return [e.clientX - rect.x - dx, e.clientY - rect.y - dy];
  };

  const drawRect = (e) => {};

  const drawLine = (point, ctx) => {
    const [x, y] = point;
    const [lx, ly] = lastPath[lastPath.length - 1] || [x, y];
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPath.push([x, y]);
  };

  const clearCanvas = (ctx) => {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, PAN_LIMIT, PAN_LIMIT);
    ctx.restore();
  };

  const drawCanvas = (ctx) => {
    clearCanvas(ctx);
    for (const item of history.current) {
      lastPath = [];
      getContext(item, ctx);
      for (const point of item.path) {
        drawModes(item.mode, point, ctx);
      }
      lastPath = [];
    }
  };

  const undoCanvas = (e) => {
    prevent(e);
    if (history.current.length === 0) return;
    redoHistory.current.push(history.current.pop());
    drawCanvas(getContext());
    render();
  };

  const redoCanvas = (e) => {
    prevent(e);
    if (redoHistory.current.length === 0) return;
    history.current.push(redoHistory.current.pop());
    drawCanvas(getContext());
    render();
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
    getContext().setTransform(
      1,
      0,
      0,
      1,
      -(PAN_LIMIT - width) / 2,
      -(PAN_LIMIT - height) / 2
    );
    drawCanvas(getContext());
    updatePreview();
    return () => {
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointermove", onPointerMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  const changeColor = (e) => {
    settings.current.color = e.target.value;
  };

  const exportCanvas = () => {
    const link = document.createElement("a");
    const content = JSON.stringify(history.current);
    const file = new Blob([content], { type: "application/json" });
    link.href = URL.createObjectURL(file);
    link.download = `canvas_export_${Date.now()}_${Math.floor(
      Math.random() * 3
    )}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importCanvas = (e) => {
    if (e.target.files.length === 0) return;
    const reader = new FileReader();
    try {
      reader.onload = () => {
        history.current = JSON.parse(reader.result);
        drawCanvas(getContext());
        render();
      };
      reader.readAsText(e.target.files[0]);
    } catch (e) {
      console.log(e);
    }
  };

  const onImportClick = () => {
    importInput.current?.click();
  };

  return (
    <>
      <canvas
        ref={canvas}
        width={width}
        height={height}
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
        <div className="preview">
          <div
            className="active"
            ref={preview}
            style={getPreviewActiveStyles()}
          ></div>
        </div>
        <button
          type="button"
          onClick={moveCanvas}
          aria-pressed={settings.current.mode === MODES.PAN}
        >
          <img src="assets/move.svg" alt="move" title="move" />
        </button>
        <button
          type="button"
          onClick={undoCanvas}
          disabled={history.current.length === 0}
        >
          <img src="assets/undo.svg" alt="undo" title="undo" />
        </button>
        <button
          type="button"
          onClick={redoCanvas}
          disabled={redoHistory.current.length === 0}
        >
          <img src="assets/redo.svg" alt="redo" title="red" />
        </button>
        <button className="color">
          <input
            type="color"
            title="change color"
            defaultValue={settings.current.color}
            onChange={changeColor}
          />
        </button>
      </div>
      <div
        className="menu right"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        aria-disabled={drawing}
      >
        <button
          type="button"
          onClick={exportCanvas}
          disabled={history.current.length === 0}
        >
          <img src="assets/export.svg" alt="export" title="export" />
        </button>
        <input
          ref={importInput}
          className="hidden"
          type="file"
          accept="application/json"
          onChange={importCanvas}
        />
        <button type="button" onClick={onImportClick}>
          <img src="assets/import.svg" alt="import" title="import" />
        </button>
      </div>
    </>
  );
};

export default Canvas;
