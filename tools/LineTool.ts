import { Tool, Element, Vec2 } from "./Tools";
import { Line, Shape } from "./Shape";
import { v4 as uuidv4 } from "uuid";

export default class LineTool implements Tool {
  private canvas: HTMLCanvasElement;
  private elements: Element[] = [];
  public shape: Line;
  public selectedShape: Shape | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.shape = new Line(new Vec2(0, 0), new Vec2(0, 0), this.canvas);
  }

  start(x: number, y: number) {
    this.shape.setStart(x, y);
  }

  update() {
    // redraw already drawn lines
    if (this.elements.length > 0) {
      for (let i = 0; i < this.elements.length; i++) {
        this.elements[i].shape.update();
      }
    }

    // draw current line
    this.shape.update();
  }

  draw(x: number, y: number) {
    this.shape.draw(x, y);
  }

  finish() {
    this.elements.push({
      id: uuidv4(),
      type: "line",
      shape: { ...this.shape },
    });
  }

  setElements(elements: Element[]) {
    this.elements = [];

    for (let i = 0; i < elements.length; i++) {
      this.elements.push({
        id: elements[i].id,
        type: "line",
        shape: new Line(
          new Vec2(elements[i].shape[0], elements[i].shape[1]),
          new Vec2(elements[i].shape[2], elements[i].shape[3]),
          this.canvas
        ),
      });
    }

    this.update();
  }

  getElements(): any {
    return this.elements.map((e) => ({
      id: e.id,
      type: e.type,
      shape: [e.shape.start.x, e.shape.start.y, e.shape.end.x, e.shape.end.y],
    }));
  }

  checkIfElementClicked(x: number, y: number): Element | null {
    for (let i = 0; i < this.elements.length; i++) {
      const shape = this.elements[i].shape as Shape;

      if (shape.checkIfClicked(x, y)) {
        if (this.selectedShape) {
          this.selectedShape.deselect();
        }

        this.selectedShape = shape;
        this.selectedShape.select();

        return this.elements[i];
      }
    }

    if (this.selectedShape) {
      this.selectedShape.deselect();
      this.selectedShape = null;
    }

    return null;
  }

  clear() {
    this.elements = [];
  }
}
