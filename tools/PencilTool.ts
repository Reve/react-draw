import { Pencil } from "./Shape";
import { Element, Tool } from "./Tools";
import { Point } from "roughjs/bin/geometry";
import { v4 as uuidv4 } from "uuid";
import simplify from "simplify-js";

export default class PencilTool implements Tool {
  private elements: Element[] = [];
  private shape: Pencil;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.shape = new Pencil([], canvas);
  }

  start(x: number, y: number) {}

  update() {
    for (let i = 0; i < this.elements.length; i++) {
      if (this.elements[i].shape) {
        this.elements[i].shape.update();
      }
    }

    this.shape.update();
  }

  draw(x: number, y: number) {
    const point = [x, y] as Point;

    this.shape.points.push(point);
    this.update();
  }

  finish() {
    const lessPoints = simplify(
      this.shape.points.map((p) => ({ x: p[0], y: p[1] })),
      5,
      false
    );

    this.shape.points = lessPoints.map((p) => [p.x, p.y]);

    this.elements.push({
      id: uuidv4(),
      type: "pencil",
      shape: { ...this.shape },
    });

    this.shape.points = [];
  }

  setElements(elements: Element[]) {
    this.elements = [];

    for (let i = 0; i < elements.length; i++) {
      this.elements.push({
        id: elements[i].id,
        type: elements[i].type,
        shape: new Pencil(elements[i].shape, this.canvas),
      });
    }

    this.update();
  }

  getElements(): any {
    return this.elements.map((e) => ({
      id: e.id,
      type: e.type,
      shape: e.shape.points,
    }));
  }

  clear() {
    this.elements = [];
  }
}
