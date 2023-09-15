import { v4 as uuidv4 } from "uuid";
import { Shape, Text } from "./Shape";
import { Element, Tool, Vec2 } from "./Tools";

export default class TextTool implements Tool {
  private canvas: HTMLCanvasElement;
  private elements: Element[] = [];
  public shape: Text;
  public selectedShape: Shape | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.shape = new Text("", new Vec2(0, 0), new Vec2(0, 0), this.canvas);
  }

  start(x: number, y: number): void {
    this.shape.start.x = x;
    this.shape.start.y = y;
  }

  update(): void {
    if (this.elements.length > 0) {
      for (let i = 0; i < this.elements.length; i++) {
        this.elements[i].shape.update();
      }
    }

    this.shape.update();
  }

  draw(x: number, y: number): void {
    this.shape.draw(x, y);
  }

  finish(): void {
    this.elements.push({
      id: uuidv4(),
      type: "text",
      shape: { ...this.shape },
    });
  }

  setText(text: string): void {
    this.shape.setText(text);
  }

  setElements(elements: Element[]): void {
    this.elements = [];

    for (let i = 0; i < elements.length; i++) {
      this.elements.push({
        id: elements[i].id,
        type: "text",
        shape: new Text(
          elements[i].shape[4],
          new Vec2(elements[i].shape[0], elements[i].shape[1]),
          new Vec2(elements[i].shape[2], elements[i].shape[3]),
          this.canvas
        ),
      });
    }

    this.update();
  }

  getElements(): Element[] {
    return this.elements.map((e) => ({
      id: e.id,
      type: e.type,
      shape: [
        e.shape.start.x,
        e.shape.start.y,
        e.shape.end.x,
        e.shape.end.y,
        e.shape.text,
      ],
    }));
  }

  clear(): void {
    this.elements = [];
  }
}
