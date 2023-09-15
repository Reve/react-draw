import rough from "roughjs/bin/rough";
import { Point } from "roughjs/bin/geometry";
import {
  Vec2,
  Transform,
  OOBB,
  interpolate,
  computeBoxVertices,
} from "./Tools";
import { RoughCanvas } from "roughjs/bin/canvas";

class Shape {
  public transform: Transform = {
    position: new Vec2(0, 0),
    scale: 1,
    rotation: 0,
  };

  public boundingBox: OOBB | null = null;
  public selected = false;

  public canvas: HTMLCanvasElement;
  public rc: RoughCanvas;

  constructor(public start: Vec2, public end: Vec2, canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.rc = rough.canvas(canvas);
  }

  getCoordinates() {}

  update() {}

  select() {
    this.selected = true;
    this.update();
  }

  deselect() {
    this.selected = false;
    this.update();
  }

  checkIfClicked(x: number, y: number) {
    return false;
  }
}

class Line extends Shape {
  constructor(public start: Vec2, public end: Vec2, canvas: HTMLCanvasElement) {
    super(start, end, canvas);
    this.boundingBox = OOBB.computeForLine(start, end);
  }

  public getCoordinates() {
    return [this.start.x, this.start.y, this.end.x, this.end.y];
  }

  public setStart(x: number, y: number) {
    this.start.x = x;
    this.start.y = y;
  }

  public update() {
    this.boundingBox = OOBB.computeForLine(this.start, this.end);

    this.rc.line(this.start.x, this.start.y, this.end.x, this.end.y, {
      stroke: "green",
    });

    if (this.selected) {
      const ctx = this.canvas.getContext("2d");

      if (!ctx) return;

      ctx.beginPath();
      ctx.strokeStyle = "black";

      const vertices = this.boundingBox.getVertices();

      for (let i = 0; i < vertices.length; i++) {
        ctx.lineTo(vertices[i].x, vertices[i].y);
      }

      ctx.lineTo(vertices[0].x, vertices[0].y);
      ctx.stroke();
    }
  }

  public draw(x: number, y: number) {
    this.end.x = x;
    this.end.y = y;

    this.update();
  }

  public moveTo(x: number, y: number) {
    if (!this.selected) {
      return;
    }

    const newPos = new Vec2(
      this.end.x - this.start.x,
      this.end.y - this.start.y
    );

    const destPos = new Vec2(x - newPos.x / 2, y - newPos.y / 2);

    while (
      Math.abs(this.start.x - destPos.x) > 1 ||
      Math.abs(this.start.y - destPos.y) > 1
    ) {
      this.start.x = interpolate(this.start.x, x - newPos.x / 2, 0.1);
      this.start.y = interpolate(this.start.y, y - newPos.y / 2, 0.1);
      this.end.x = interpolate(this.end.x, x + newPos.x / 2, 0.1);
      this.end.y = interpolate(this.end.y, y + newPos.y / 2, 0.1);
    }

    this.update();
  }

  public checkIfClicked(x: number, y: number) {
    if (!this.boundingBox) return false;

    if (OOBB.isPointInside(new Vec2(x, y), this.boundingBox)) {
      return true;
    }

    return false;
  }
}

class Box extends Line {
  constructor(public start: Vec2, public end: Vec2, canvas: HTMLCanvasElement) {
    super(start, end, canvas);
  }

  public update() {
    const ctx = this.canvas.getContext("2d");
    const vertices = computeBoxVertices(this.start, this.end);

    if (!ctx) return;

    ctx.beginPath();
    ctx.strokeStyle = "black";

    if (this.selected) {
      ctx.strokeStyle = "red";
    }

    for (let i = 0; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }

    ctx.lineTo(vertices[0].x, vertices[0].y);
    ctx.stroke();
  }

  public draw(x: number, y: number) {
    this.end.x = x;
    this.end.y = y;

    this.update();
  }

  public moveTo(x: number, y: number) {
    if (!this.selected) {
      return;
    }

    const newPos = new Vec2(
      this.end.x - this.start.x,
      this.end.y - this.start.y
    );

    const destPos = new Vec2(x - newPos.x / 2, y - newPos.y / 2);

    while (
      Math.abs(this.start.x - destPos.x) > 1 ||
      Math.abs(this.start.y - destPos.y) > 1
    ) {
      this.start.x = interpolate(this.start.x, x - newPos.x / 2, 0.1);
      this.start.y = interpolate(this.start.y, y - newPos.y / 2, 0.1);
      this.end.x = interpolate(this.end.x, x + newPos.x / 2, 0.1);
      this.end.y = interpolate(this.end.y, y + newPos.y / 2, 0.1);
    }

    this.update();
  }

  public checkIfClicked(x: number, y: number) {
    if (
      x > this.start.x &&
      x < this.end.x &&
      y > this.start.y &&
      y < this.end.y
    ) {
      return true;
    }

    return false;
  }
}

class Text extends Shape {
  constructor(
    public text: string,
    public start: Vec2,
    public end: Vec2,
    public canvas: HTMLCanvasElement
  ) {
    super(start, end, canvas);
  }

  public update() {
    const ctx = this.canvas.getContext("2d");
    //    const vertices = computeBoxVertices(this.start, this.end);

    if (!ctx) return;

    //  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.font = "30px Arial";
    ctx.fillText(this.text, this.start.x, this.start.y);

    /*
    ctx.beginPath();
    ctx.strokeStyle = "black";

    if (this.selected) {
      ctx.strokeStyle = "red";
    }

    for (let i = 0; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }

    ctx.lineTo(vertices[0].x, vertices[0].y);
    ctx.stroke();
  */
  }

  public draw(x: number, y: number) {
    this.end.x = x;
    this.end.y = y;

    this.update();
  }

  public moveTo(x: number, y: number) {
    if (!this.selected) {
      return;
    }

    const newPos = new Vec2(
      this.end.x - this.start.x,
      this.end.y - this.start.y
    );

    const destPos = new Vec2(x - newPos.x / 2, y - newPos.y / 2);

    while (
      Math.abs(this.start.x - destPos.x) > 1 ||
      Math.abs(this.start.y - destPos.y) > 1
    ) {
      this.start.x = interpolate(this.start.x, x - newPos.x / 2, 0.1);
      this.start.y = interpolate(this.start.y, y - newPos.y / 2, 0.1);
      this.end.x = interpolate(this.end.x, x + newPos.x / 2, 0.1);
      this.end.y = interpolate(this.end.y, y + newPos.y / 2, 0.1);
    }

    this.update();

    this.start.x = x;
    this.start.y = y;
  }

  public checkIfClicked(x: number, y: number) {
    if (
      x > this.start.x &&
      x < this.end.x &&
      y > this.start.y &&
      y < this.end.y
    ) {
      return true;
    }

    return false;
  }

  public setText(text: string) {
    this.text = text;
    this.update();
  }
}

class Pencil {
  private rc: RoughCanvas | null;

  constructor(public points: Point[] = [], canvas: HTMLCanvasElement) {
    this.rc = rough.canvas(canvas);
  }

  public update() {
    if (this.points.length > 0) {
      this.rc?.curve(this.points, { stroke: "black" });
    }
  }
}

export { Shape, Line, Box, Text, Pencil };
