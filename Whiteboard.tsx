import { useEffect, useRef, useState } from "react";
import {
  Button,
  ButtonGroup,
  OverlayTrigger,
  Tooltip,
} from "@themesberg/react-bootstrap";
import { Tool } from "./tools/Tools";
import LineTool from "./tools/LineTool";
import PencilTool from "./tools/PencilTool";
import BoxTool from "./tools/BoxTool";
import { Element } from "./tools/Tools";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDrawPolygon,
  faFont,
  faHand,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faMousePointer,
  faPencilAlt,
  faSquare,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import TextTool from "./tools/TextTool";

type Props = {
  data: any;
  onUpdate: (data: string) => void;
};

type Toolbox = {
  line: LineTool | null;
  pencil: PencilTool | null;
  box: BoxTool | null;
  text: TextTool | null;
  move: null;
  hand: null;
};

export default function Whiteboard({ data, onUpdate }: Props) {
  const initialData = {
    line: [],
    box: [],
    pencil: [],
    text: [],
  };
  const [isDrawing, setIsDrawing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [loadedData, setLoadedData] = useState(initialData);
  const [toolChanged, setToolChanged] = useState(false); // this is just to trick React to rerender the component
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const tool = useRef<Tool | null>(null); // current tool
  const toolbox = useRef<Toolbox>({
    line: null,
    box: null,
    pencil: null,
    text: null,
    move: null,
    hand: null,
  });
  const selectedTool = useRef("");
  const selectedElement = useRef<Element | null>(null);
  const isDragging = useRef(false);
  const isTyping = useRef(false);
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const panningStart = useRef({ x: 0, y: 0 });
  const canvasTransform = useRef({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    if (!canvas.current) {
      return;
    }

    toolbox.current.line = new LineTool(canvas.current);
    toolbox.current.box = new BoxTool(canvas.current);
    toolbox.current.pencil = new PencilTool(canvas.current);
    toolbox.current.text = new TextTool(canvas.current);

    setTool("line");

    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!data) {
      return;
    }

    const _canvas = canvas.current;

    if (_canvas === null) {
      return;
    }

    const ctx = _canvas.getContext("2d");

    if (ctx === null) {
      return;
    }

    const canvasData = data.hand;

    console.log(canvasData);

    if (canvasData !== undefined && canvas.current !== null) {
      ctx.clearRect(0, 0, _canvas.width, _canvas.height);

      ctx.save();
      ctx.translate(canvasData.x, canvasData.y);

      canvasTransform.current = {
        x: canvasData.x,
        y: canvasData.y,
        scale: canvasData.scale,
      };
      setLoadedData(data);

      Object.keys(data).forEach((key) => {
        toolbox.current[key as keyof Toolbox]?.setElements(data[key]);
      });
      ctx.restore();
    }
  }, [data, onUpdate]);

  const setTool = (toolType: string) => {
    switch (toolType) {
      case "line":
        tool.current = toolbox.current.line;
        selectedTool.current = "line";
        break;
      case "box":
        tool.current = toolbox.current.box;
        selectedTool.current = "box";
        break;
      case "pencil":
        tool.current = toolbox.current.pencil;
        selectedTool.current = "pencil";
        break;
      case "text":
        tool.current = toolbox.current.text;
        selectedTool.current = "text";
        break;
      case "move":
        tool.current = toolbox.current.move;
        selectedTool.current = "move";
        break;
      case "hand":
        tool.current = toolbox.current.hand;
        selectedTool.current = "hand";
        break;
      default:
        tool.current = toolbox.current.line;
        selectedTool.current = "line";
        break;
    }

    setToolChanged(true);
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (tool === null || tool.current === null) {
      return;
    }

    if (event.key === "Escape" || event.key === "Enter") {
      tool.current?.finish();

      if (textInputRef.current === null) {
        return;
      }

      textInputRef.current.style.display = "none";
      textInputRef.current.value = "";

      const elements = tool.current.getElements();
      console.log("loadedData", loadedData);
      console.log("elements", elements);
      console.log("selectedTool", selectedTool.current);
      data = JSON.stringify({
        ...loadedData,
        [selectedTool.current]: [...elements],
      });

      onUpdate(data);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const _tool = tool.current as TextTool;
    _tool.setText(event.target.value);

    if (canvas.current === null) {
      return;
    }

    // clear the screen to allow for redraw
    canvas.current
      .getContext("2d")
      ?.clearRect(0, 0, canvas.current.width, canvas.current.height);

    for (let key of Object.keys(toolbox.current)) {
      toolbox.current[key as keyof Toolbox]?.update();
    }
  };

  const mouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { clientX, clientY } = event;

    if (canvas.current === null) {
      return;
    }

    // clear the screen to allow for redraw
    const ctx = canvas.current.getContext("2d");

    if (ctx === null) {
      return;
    }

    const viewportOffset = canvas.current.getBoundingClientRect();
    const x = clientX - viewportOffset.left;
    const y = clientY - viewportOffset.top;

    if (selectedTool.current === "move") {
      setIsMoving(true);
      isDragging.current = true;

      let elem = toolbox.current?.line?.checkIfElementClicked(x, y);

      if (!elem) {
        elem = toolbox.current?.box?.checkIfElementClicked(x, y);
      }

      if (elem) {
        selectedElement.current = elem;
      }
    } else if (selectedTool.current === "text") {
      isTyping.current = true;
      tool.current?.start(x, y);

      if (textInputRef.current === null) {
        return;
      }

      textInputRef.current.style.display = "block";
      textInputRef.current.style.position = "absolute";
      textInputRef.current.style.left = `${clientX}px`;
      textInputRef.current.style.top = `${clientY}px`;
      textInputRef.current.style.border = "solid 1px black";
      textInputRef.current.focus();
    } else if (selectedTool.current === "hand") {
      panningStart.current = { x, y };
      setIsMoving(true);
    } else {
      setIsDrawing(true);

      tool.current?.start(x, y);
    }

    for (let key of Object.keys(toolbox.current)) {
      toolbox.current[key as keyof Toolbox]?.update();
    }
  };

  const mouseMoved = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && !isMoving) {
      return;
    }

    if (canvas.current === null) {
      console.log("in draw canvas is null");
      return;
    }

    if (tool === null) {
      console.log("in draw tool is null");
      return;
    }

    const { clientX, clientY } = event;
    const viewportOffset = canvas.current.getBoundingClientRect();

    const ctx = canvas.current.getContext("2d");

    if (ctx === null || ctx === undefined) {
      return;
    }

    ctx.clearRect(
      0,
      0,
      canvas.current.width * (canvasTransform.current.scale + 1),
      canvas.current.height * (canvasTransform.current.scale + 1)
    );

    // call draw on tool and retrieve elements
    if (!viewportOffset) {
      return;
    }

    if (selectedTool.current === "move") {
      if (selectedElement.current && selectedElement.current.shape) {
        const shape = selectedElement.current.shape;

        if (shape) {
          shape.moveTo(
            clientX - viewportOffset.left,
            clientY - viewportOffset.top
          );
        }
      }
    } else if (selectedTool.current === "hand") {
      const mouseX = clientX - viewportOffset.left;
      const mouseY = clientY - viewportOffset.top;

      const deltaX = mouseX - panningStart.current.x;
      const deltaY = mouseY - panningStart.current.y;

      const panX = canvasTransform.current.x + deltaX;
      const panY = canvasTransform.current.y + deltaY;

      canvasTransform.current = {
        x: panX,
        y: panY,
        scale: canvasTransform.current.scale,
      };

      panningStart.current = { x: mouseX, y: mouseY };

      ctx.save();
      ctx.translate(panX, panY);

      for (let key of Object.keys(toolbox.current)) {
        toolbox.current[key as keyof Toolbox]?.update();
      }

      ctx.restore();

      return;
    } else {
      tool.current?.draw(
        event.clientX - viewportOffset.left,
        event.clientY - viewportOffset.top
      );
    }

    for (let key of Object.keys(toolbox.current)) {
      toolbox.current[key as keyof Toolbox]?.update();
    }
  };

  const mouseUp = () => {
    setIsDrawing(false);
    setIsMoving(false);
    isDragging.current = false;
    panningStart.current = { x: 0, y: 0 };

    let elements: Element[] = [];
    let data: string = "";

    if (selectedTool.current === "move") {
      data = JSON.stringify({
        line: [...(toolbox.current.line?.getElements() || [])],
        box: [...(toolbox.current.box?.getElements() || [])],
        text: [...(toolbox.current.text?.getElements() || [])],
      });
    } else if (selectedTool.current === "hand") {
      if (canvas.current === null) {
        return;
      }

      const ctx = canvas.current?.getContext("2d");

      if (ctx === null) {
        return;
      }

      data = JSON.stringify({
        ...loadedData,
        [selectedTool.current]: canvasTransform.current,
      });
    } else {
      if (tool.current !== null) {
        tool.current.finish();
        elements = tool.current.getElements();
      }

      data = JSON.stringify({
        ...loadedData,
        [selectedTool.current]: [...elements],
      });
    }

    onUpdate(data);
  };

  const clearScreen = () => {
    canvas.current?.getContext("2d")?.clearRect(0, 0, 1000, 800);

    for (let key of Object.keys(toolbox.current)) {
      toolbox.current[key as keyof Toolbox]?.clear();
    }

    setLoadedData(initialData);
    onUpdate("");
  };

  const handleZoom = (direction: string) => {
    if (canvas.current === null) {
      return;
    }

    const ctx = canvas.current.getContext("2d");

    if (ctx === null) {
      return;
    }

    ctx.clearRect(0, 0, 1000, 800);

    if (direction === "in") {
      ctx.scale(1.1, 1.1);
      canvasTransform.current.scale = canvasTransform.current.scale * 1.1;
    } else {
      ctx.scale(0.9, 0.9);
      canvasTransform.current.scale = canvasTransform.current.scale * 1.1;
    }

    for (let key of Object.keys(toolbox.current)) {
      toolbox.current[key as keyof Toolbox]?.update();
    }
  };

  const setCursor = () => {
    switch (selectedTool.current) {
      case "move":
        return "default";
      case "hand":
        return "pointer";
      case "text":
        return "text";
      default:
        return "crosshair";
    }
  };

  const renderTooltip = (text: string, props: any) => (
    <Tooltip id="button-tooltip" {...props}>
      {text}
    </Tooltip>
  );

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      {toolChanged && <div style={{ visibility: "hidden" }}> </div>}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <ButtonGroup vertical>
          <OverlayTrigger
            placement="auto"
            overlay={(props) => renderTooltip("Muta", props)}
          >
            <Button
              variant="outline-dark"
              disabled={selectedTool.current === "move"}
              onClick={() => setTool("move")}
              style={{ borderTopRightRadius: 0 }}
            >
              <FontAwesomeIcon icon={faMousePointer} />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="auto"
            overlay={(props) => renderTooltip("Gliseaza", props)}
          >
            <Button
              variant="outline-dark"
              disabled={selectedTool.current === "hand"}
              onClick={() => setTool("hand")}
              style={{ borderTopRightRadius: 0 }}
            >
              <FontAwesomeIcon icon={faHand} />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="auto"
            overlay={(props) => renderTooltip("Zoom in", props)}
          >
            <Button
              variant="outline-dark"
              onClick={() => handleZoom("in")}
              style={{ borderTopRightRadius: 0 }}
            >
              <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="auto"
            overlay={(props) => renderTooltip("Zoom out", props)}
          >
            <Button
              variant="outline-dark"
              onClick={() => handleZoom("out")}
              style={{ borderTopRightRadius: 0 }}
            >
              <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="auto"
            overlay={(props) => renderTooltip("Linie", props)}
          >
            <Button
              variant="outline-dark"
              disabled={selectedTool.current === "line"}
              onClick={() => setTool("line")}
            >
              <FontAwesomeIcon icon={faDrawPolygon} />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="auto"
            overlay={(props) => renderTooltip("Patrat", props)}
          >
            <Button
              variant="outline-dark"
              disabled={selectedTool.current === "box"}
              onClick={() => setTool("box")}
            >
              <FontAwesomeIcon icon={faSquare} />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="auto"
            overlay={(props) => renderTooltip("Creion", props)}
          >
            <Button
              variant="outline-dark"
              disabled={selectedTool.current === "pencil"}
              onClick={() => setTool("pencil")}
            >
              <FontAwesomeIcon icon={faPencilAlt} />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="auto"
            overlay={(props) => renderTooltip("Text", props)}
          >
            <Button
              variant="outline-dark"
              disabled={selectedTool.current === "text"}
              onClick={() => setTool("text")}
            >
              <FontAwesomeIcon icon={faFont} />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="left"
            overlay={(props) => renderTooltip("Sterge tot", props)}
          >
            <Button
              variant="outline-dark"
              onClick={clearScreen}
              style={{ borderBottomRightRadius: 0 }}
            >
              <FontAwesomeIcon icon={faTrashCan} />
            </Button>
          </OverlayTrigger>
        </ButtonGroup>
      </div>
      <canvas
        ref={canvas}
        id="canvas"
        width="1000"
        height="800"
        onMouseDown={mouseDown}
        onMouseMove={mouseMoved}
        onMouseUp={mouseUp}
        onMouseLeave={mouseUp}
        style={{
          background: "white",
          cursor: setCursor(),
          border: "1px solid #282b40",
        }}
      >
        Board
      </canvas>
      <input
        type="text"
        ref={textInputRef}
        style={{ display: "none" }}
        onChange={handleInputChange}
      />
    </div>
  );
}
