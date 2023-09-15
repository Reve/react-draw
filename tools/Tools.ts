export type Line = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type Element = {
  id: string;
  type: string;
  shape: any;
};

export interface Tool {
  start: (x: number, y: number) => void;
  update: () => void;
  draw: (x: number, y: number) => void;
  finish: () => void;
  setText?: (text: string) => void;
  setElements: (elements: Element[]) => void;
  getElements: () => Element[];
  clear: () => void;
}

export class Vec2 {
  constructor(public x: number, public y: number) {}

  public add(vec: Vec2): Vec2 {
    return new Vec2(this.x + vec.x, this.y + vec.y);
  }

  public subtract(vec: Vec2): Vec2 {
    return new Vec2(this.x - vec.x, this.y - vec.y);
  }

  public multiply(vec: Vec2): Vec2 {
    return new Vec2(this.x * vec.x, this.y * vec.y);
  }

  public divide(vec: Vec2): Vec2 {
    return new Vec2(this.x / vec.x, this.y / vec.y);
  }

  public scale(scalar: number): Vec2 {
    return new Vec2(this.x * scalar, this.y * scalar);
  }

  public dot(vec: Vec2): number {
    return this.x * vec.x + this.y * vec.y;
  }

  public length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  public normalize(): Vec2 {
    const length = this.length();
    return new Vec2(this.x / length, this.y / length);
  }

  public distanceTo(vec: Vec2): number {
    return Math.sqrt(Math.pow(vec.x - this.x, 2) + Math.pow(vec.y - this.y, 2));
  }

  public equals(vec: Vec2): boolean {
    return this.x === vec.x && this.y === vec.y;
  }

  public cross(vec: Vec2): number {
    return this.x * vec.y - this.y * vec.x;
  }

  public clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  public static fromAngle(angle: number): Vec2 {
    return new Vec2(Math.cos(angle), Math.sin(angle));
  }

  public static polarAngle(p0: Vec2, p1: Vec2): number {
    return Math.atan2(p1.y - p0.y, p1.x - p0.x);
  }

  public static grahamScan(points: Vec2[]): Vec2[] {
    if (points.length < 3) {
      return points;
    }

    let start = points.reduce((lowest, point) =>
      point.y < lowest.y || (point.y === lowest.y && point.x < lowest.x)
        ? point
        : lowest
    );

    points = points.filter((p) => p !== start);
    points.sort(
      (a, b) => this.polarAngle(start, a) - this.polarAngle(start, b)
    );

    let hull: Vec2[] = [start];

    for (let point of points) {
      while (
        hull.length > 1 &&
        point
          .subtract(hull[hull.length - 1])
          .cross(hull[hull.length - 1].subtract(hull[hull.length - 2])) <= 0
      ) {
        hull.pop();
      }

      hull.push(point);
    }

    return hull;
  }
}

export class OOBB {
  constructor(
    public center: Vec2,
    public halfExtent: Vec2,
    public orientation: number
  ) {}

  public area(): number {
    return 4 * this.halfExtent.x * this.halfExtent.y;
  }

  public getVertices(): Vec2[] {
    let vertices = [
      new Vec2(-this.halfExtent.x, -this.halfExtent.y),
      new Vec2(this.halfExtent.x, -this.halfExtent.y),
      new Vec2(this.halfExtent.x, this.halfExtent.y),
      new Vec2(-this.halfExtent.x, this.halfExtent.y),
    ];

    for (let i = 0; i < vertices.length; i++) {
      let x = vertices[i].x;
      let y = vertices[i].y;

      vertices[i].x =
        Math.cos(this.orientation) * x - Math.sin(this.orientation) * y;
      vertices[i].y =
        Math.sin(this.orientation) * x + Math.cos(this.orientation) * y;

      vertices[i] = vertices[i].add(this.center);
    }

    return vertices;
  }

  public static computeForLine(p1: Vec2, p2: Vec2): OOBB {
    const direction = p2.subtract(p1).normalize();

    const halfExtentAlongLine =
      Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) / 2;
    const halfExtentPerpendicular = 40.01;

    const orientation = Math.atan2(direction.y, direction.x);
    const center = new Vec2((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);

    return new OOBB(
      center,
      new Vec2(halfExtentAlongLine, halfExtentPerpendicular),
      orientation
    );
  }

  public static compute(points: Vec2[]): OOBB {
    const convexHull = Vec2.grahamScan(points);

    let bestArea = Infinity;
    let bestOOBB: OOBB | null = null;

    for (let i = 0; i < convexHull.length; i++) {
      const p1 = convexHull[i];
      const p2 = convexHull[(i + 1) % convexHull.length];

      const edgeDirection = p2.subtract(p1).normalize();
      const orientation = Math.atan2(edgeDirection.y, edgeDirection.x);

      let minRotatedX = Infinity;
      let maxRotatedX = -Infinity;
      let minRotatedY = Infinity;
      let maxRotatedY = -Infinity;

      for (const point of convexHull) {
        const rotatedX =
          Math.cos(-orientation) * point.x + Math.sin(-orientation) * point.y;
        const rotatedY =
          -Math.sin(-orientation) * point.x + Math.cos(-orientation) * point.y;

        minRotatedX = Math.min(minRotatedX, rotatedX);
        maxRotatedX = Math.max(maxRotatedX, rotatedX);
        minRotatedY = Math.min(minRotatedY, rotatedY);
        maxRotatedY = Math.max(maxRotatedY, rotatedY);
      }

      const width = maxRotatedX - minRotatedX;
      const height = maxRotatedY - minRotatedY;
      const area = width * height;

      if (area < bestArea) {
        bestArea = area;
        const center = new Vec2(
          (minRotatedX + maxRotatedX) / 2,
          (minRotatedY + maxRotatedY) / 2
        );
        const originalCenterX =
          Math.cos(orientation) * center.x + Math.sin(orientation) * center.y;
        const originalCenterY =
          -Math.sin(orientation) * center.x + Math.cos(orientation) * center.y;

        bestOOBB = new OOBB(
          new Vec2(originalCenterX, originalCenterY),
          new Vec2(width / 2, height / 2),
          orientation
        );
      }
    }

    return bestOOBB!;
  }

  public static isPointInside(point: Vec2, oobb: OOBB): boolean {
    let relative = point.subtract(oobb.center);
    let orientedX =
      Math.cos(oobb.orientation) * relative.x +
      Math.sin(oobb.orientation) * relative.y;
    let orientedY =
      Math.sin(oobb.orientation) * relative.x -
      Math.cos(oobb.orientation) * relative.y;

    return (
      Math.abs(orientedX) <= oobb.halfExtent.x &&
      Math.abs(orientedY) <= oobb.halfExtent.y
    );
  }
}

export type Transform = {
  position: Vec2;
  scale: number;
  rotation: number;
};

export class BoundingBox {
  constructor(public vertices: Vec2[]) {}

  calculateBoundingBox() {
    let min = new Vec2(Infinity, Infinity);
    let max = new Vec2(-Infinity, -Infinity);

    for (let i = 0; i < this.vertices.length; i++) {
      min.x = Math.min(min.x, this.vertices[i].x);
      min.y = Math.min(min.y, this.vertices[i].y);
      max.x = Math.max(max.x, this.vertices[i].x);
      max.y = Math.max(max.y, this.vertices[i].y);
    }

    return { min, max };
  }
}

export function interpolate(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function computeBoxVertices(start: Vec2, end: Vec2) {
  const distance = new Vec2(end.x - start.x, end.y - start.y);

  return [
    new Vec2(start.x, start.y),
    new Vec2(start.x + distance.x, start.y),
    new Vec2(start.x + distance.x, start.y + distance.y),
    new Vec2(start.x, start.y + distance.y),
  ];
}
