import { useEffect, useRef } from "react";

const MODES = {
  LINE: 1,
  RECT: 2,
  CIRCLE: 3,
};

const Canvas = ({ ...rest }) => {
  const settings = useRef({
    stroke: 3,
    color: "#000",
    mode: MODES.LINE,
    draw: false,
    lastPoints: [],
  });

  const canvas = useRef(null);

  const prevent = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onPointerDown = (e) => {
    prevent(e);
    settings.current.draw = true;
  };

  const onPointerUp = (e) => {
    prevent(e);
    settings.current.draw = false;
    settings.current.lastPoints = [];
  };

  const onPointerMove = (e) => {
    if (!settings.current.draw) return;
    prevent(e);
    switch (settings.current.mode) {
      case MODES.LINE:
        drawLine(e);
        break;
      case MODES.RECT:
        drawRect(e);
        break;
      default:
        return;
    }
    settings.current.lastPoints = getPoints(e);
  };

  const getContext = () => {
    const ctx = canvas.current.getContext("2d");
    ctx.fillStyle = settings.current.color;
    ctx.lineWidth = settings.current.stroke;
    return ctx;
  };
  const getPoints = (e) => {
    const rect = canvas.current.getBoundingClientRect();
    return [e.clientX - rect.x, e.clientY - rect.y];
  };

  const drawRect = (e) => {};

  const drawLine = (e) => {
    const ctx = getContext();
    const [x, y] = getPoints(e);
    const [lx, ly] = settings.current.lastPoints;
    ctx.beginPath();
    ctx.moveTo(lx || x, ly || y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clearCanvas = (e) => {
    prevent(e);
    const ctx = getContext()
    ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);
  };

  useEffect(() => {
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointermove", onPointerMove);
    return () => {
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointermove", onPointerMove);
    };
  }, [canvas.current]);

  return (
    <canvas
      ref={canvas}
      {...rest}
      onPointerDown={onPointerDown}
      onContextMenu={clearCanvas}
      onPointerUp={onPointerUp}
    />
  );
};

export default Canvas;
