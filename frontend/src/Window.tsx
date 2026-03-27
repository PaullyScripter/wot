import { useEffect, useRef, useState } from "react";

type WindowProps = {
  title: string;
  children: React.ReactNode;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
  onClose?: () => void;
  onMinimize?: () => void;
  zIndex?: number;
  onFocus?: () => void;
  isMinimized?: boolean;
};

export function Window({
  title,
  children,
  initialX = 80,
  initialY = 80,
  initialWidth = 700,
  initialHeight = 500,
  onClose,
  onMinimize,
  zIndex = 1,
  onFocus,
  isMinimized = false,
}: WindowProps) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isMaximized, setIsMaximized] = useState(false);
  const savedState = useRef({ x: initialX, y: initialY, width: initialWidth, height: initialHeight });

  const dragRef = useRef({ dragging: false, offsetX: 0, offsetY: 0 });
  const resizeRef = useRef({ resizing: false, startX: 0, startY: 0, startWidth: initialWidth, startHeight: initialHeight });

  function handleFocus() { onFocus?.(); }

  function startDrag(e: React.MouseEvent<HTMLDivElement>) {
    if (isMaximized) return;
    e.preventDefault();
    handleFocus();
    dragRef.current = { dragging: true, offsetX: e.clientX - pos.x, offsetY: e.clientY - pos.y };
  }

  function startResize(e: React.MouseEvent<HTMLDivElement>) {
    if (isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    handleFocus();
    resizeRef.current = { resizing: true, startX: e.clientX, startY: e.clientY, startWidth: size.width, startHeight: size.height };
  }

  function toggleMaximize() {
    if (isMaximized) {

      setPos({ x: savedState.current.x, y: savedState.current.y });
      setSize({ width: savedState.current.width, height: savedState.current.height });
      setIsMaximized(false);
    } else {

      savedState.current = { x: pos.x, y: pos.y, width: size.width, height: size.height };
      setPos({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight - 48 });
      setIsMaximized(true);
      handleFocus();
    }
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (dragRef.current.dragging) {
        setPos({
          x: Math.max(0, e.clientX - dragRef.current.offsetX),
          y: Math.max(0, e.clientY - dragRef.current.offsetY),
        });
      }
      if (resizeRef.current.resizing) {
        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;
        setSize({
          width: Math.max(320, resizeRef.current.startWidth + dx),
          height: Math.max(220, resizeRef.current.startHeight + dy),
        });
      }
    }
    function onMouseUp() {
      dragRef.current.dragging = false;
      resizeRef.current.resizing = false;
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);


  if (isMinimized) return null;

  return (
    <div
      className="window-tab"
      onMouseDown={handleFocus}
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: size.width,
        height: size.height,
        zIndex,
      }}
    >
      
      <div className="window-titlebar" onMouseDown={startDrag}>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0, marginLeft: 8 }}>
          
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => onMinimize?.()}
            title="Minimize"
            aria-label="Minimize"
          >
            _
          </button>

          
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={toggleMaximize}
            title={isMaximized ? "Restore" : "Maximize"}
            aria-label={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? "❐" : "□"}
          </button>

          
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onClose ?? undefined}
            title="Close"
            aria-label="Close"
            style={{ opacity: onClose ? 1 : 0.4, cursor: onClose ? "pointer" : "default" }}
          >
            ✕
          </button>
        </div>
      </div>

      
      <div
        className="window-content"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{ position: "relative", height: "calc(100% - 36px)", boxSizing: "border-box", overflow: "auto" }}
      >
        {children}
      </div>

      
      {!isMaximized && (
        <div
          onMouseDown={startResize}
          style={{
            position: "absolute", right: 0, bottom: 0,
            width: 16, height: 16, cursor: "nwse-resize",
            background: "linear-gradient(135deg, transparent 50%, #808080 50%)",
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
}