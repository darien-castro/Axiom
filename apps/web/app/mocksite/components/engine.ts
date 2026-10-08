//
// interfaces necessary for mock data
//
// will most likely be replaced with own files and export interfaces once we have real data comming in
// and will be used all throughout project
//
//
interface Course {
  name: string
  credits: number
  gradeLow: boolean
  assignments: []
}
// etc...
interface Assignment{
  name: string
  points: number
}


// individual nodes
export class physNode {
  constructor(course: Course) {
    this.weight = course.credits + 1// weight...
    this.name = course.name
    this.xpos = 0;
    this.ypos = 0;
    this.vx = 0 // velocity
    this.vy = 0
    this.gradeLow = course.gradeLow
  }
  weight: number
  name: string
  xpos: number
  ypos: number
  vx: number
  vy: number
  setPosition(x: number, y: number) {
    this.xpos = x
    this.ypos = y
  }
  returnPosition() {
    return { x: this.xpos, y: this.ypos }
  }
}

class physChildNode {
  constructor(assignment: Assignment) {
    this.weight = assignment.points
    this.name = assignment.name
  }
  weight: number
  name: string
}

export class Engine {
  private animationFrameId: number | null = null;
  screenSize: { width: number; height: number };
  gravity: number;
  nodes: physNode[] = [];
  ctx: CanvasRenderingContext2D;

  private mousePos: { x: number; y: number; clicked: boolean } | null = null;

  private draggedNode: physNode | null = null;

  constructor(gravity: number, screenSize: { width: number; height: number }, ctx: CanvasRenderingContext2D) {
    this.gravity = gravity;
    this.screenSize = screenSize;
    this.ctx = ctx;
  }

  setMousePos(pos: { x: number; y: number; clicked: boolean } | null) {
    this.mousePos = pos;
  }

  addNode(node: physNode) {
    this.nodes.push(node);
    node.setPosition(
      Math.floor(Math.random() * this.screenSize.width),
      Math.floor(Math.random() * this.screenSize.height)
    );
  }

  drawNode(node: physNode) {
    this.ctx.beginPath();
    this.ctx.arc(node.xpos, node.ypos, node.weight * 12, 0, Math.PI * 2);
    if (node.gradeLow) {
      this.ctx.fillStyle = "rgba(191, 97, 106, .25)";
    }
    else {
      this.ctx.fillStyle = "rgba(162, 189, 139, .25)";
    }
    this.ctx.fill();

    this.ctx.font = "10px serif";
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.textAlign = "center";
    this.ctx.fillText(node.name, node.xpos, node.ypos + 5);
  }

  update() {
      this.ctx.clearRect(0, 0, this.screenSize.width, this.screenSize.height);

      const centerWidth = this.screenSize.width / 2;
      const centerHeight = this.screenSize.height / 2;
      const repulsionStrength = 0.2;

      if (this.mousePos && this.mousePos.clicked) {
        if (!this.draggedNode) {
          for (const node of this.nodes) {
            const dx = this.mousePos.x - node.xpos;
            const dy = this.mousePos.y - node.ypos;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const radius = node.weight * 12;

            if (distance <= radius) {
              this.draggedNode = node;
              break;
            }
          }
        }
      } else {
        this.draggedNode = null;
      }

      for (const node of this.nodes) {
        const dx = centerWidth - node.xpos;
        const dy = centerHeight - node.ypos;
        node.vx += dx * this.gravity;
        node.vy += dy * this.gravity;
      }
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeA = this.nodes[i];
        const nodeB = this.nodes[j];

        const dx = nodeB.xpos - nodeA.xpos;
        const dy = nodeB.ypos - nodeA.ypos;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const radiusA = nodeA.weight * 5;
        const radiusB = nodeB.weight * 5;
        const minDistance = radiusA + radiusB + 120;

        if (distance < minDistance && distance > 0) {
          const overlap = minDistance - distance;
          const pushX = (dx / distance) * overlap * repulsionStrength;
          const pushY = (dy / distance) * overlap * repulsionStrength;

          nodeA.vx -= pushX;
          nodeA.vy -= pushY;
          nodeB.vx += pushX;
          nodeB.vy += pushY;
        }
      }
    }

    for (const node of this.nodes) {
          node.vx *= 0.75;
          node.vy *= 0.75;
          node.xpos += node.vx;
          node.ypos += node.vy;

          if (this.draggedNode === node && this.mousePos) {
            node.xpos = this.mousePos.x;
            node.ypos = this.mousePos.y;
            node.vx = 0;
            node.vy = 0;
          }

          this.drawNode(node);
        }
      }

  start() {
    this.update();
    this.animationFrameId = requestAnimationFrame(() => this.start());
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
