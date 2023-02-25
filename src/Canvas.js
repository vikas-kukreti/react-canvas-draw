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
    settings.current.lastPoints = null;
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
  };

  const getContext = () => {
    const ctx = canvas.current.getContext("2d");
    ctx.fillStyle = settings.current.color;
    ctx.lineWidth = settings.current.stroke; 
    return ctx;
  };

  const drawRect = (e) => {};

  const drawLine = (e) => {
    const ctx = getContext();
    settings.current.lastCoords = [e.clientX, e.clientY];
    ctx.beginPath();
    if (settings.current.lastPoints) {
      ctx.moveTo(
        settings.current.lastPoints[0],
        settings.current.lastPoints[1]
      );
      ctx.lineTo(e.clientX, e.clientY);
    }
    ctx.stroke();
    settings.current.lastPoints = [e.clientX, e.clientY];
  };

  useEffect(() => {
    document.addEventListener("pointerup", onPointerUp);
    return () => {
      document.removeEventListener("pointerup", onPointerUp);
    };
  });
  return (
    <canvas
      ref={canvas}
      {...rest}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    />
  );
};

export default Canvas;
