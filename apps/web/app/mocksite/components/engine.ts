interface Course {
  name: string
  credits: number
  assignments: []
}

interface Assignment{
  name: string
  points: number
}

export class physNode {
  constructor(course: Course) {
    this.weight = course.credits
    this.name = course.name
    this.xpos = 0;
    this.ypos = 0;
    this.vx = 0
    this.vy = 0
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

export class Engine{
  constructor(gravity: number, screenSize: { width: number; height: number }, ctx: CanvasRenderingContext2D) {
    this.gravity = gravity
    this.screenSize = screenSize
    this.ctx = ctx
  }
  private animationFrameId: number | null = null;
  screenSize: { width: number; height: number }
  gravity: number
  nodes: physNode[] = []
  ctx: CanvasRenderingContext2D
  addNode(node: physNode) {
    this.nodes.push(node)
    node.setPosition(
      Math.floor(Math.random() * this.screenSize.width),
      Math.floor(Math.random() * this.screenSize.height)
    )
  }
  drawNode(node: physNode) {
      this.ctx.beginPath();
      this.ctx.arc(node.xpos, node.ypos, node.weight * 12, 0, Math.PI * 2);
      this.ctx.fillStyle = "#d1d7de";
      this.ctx.fill();

      this.ctx.font = "10px, Times New Roman";
      this.ctx.fillStyle = "#7d6b8c";
      this.ctx.textAlign = "center";
      this.ctx.fillText(node.name, node.xpos, node.ypos + 5);
    }
    update() {
        this.ctx.clearRect(0, 0, this.screenSize.width, this.screenSize.height);

        const centerWidth = this.screenSize.width / 2;
        const centerHeight = this.screenSize.height / 2;
        const repulsionStrength = .2;

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
            const minDistance = radiusA + radiusB + 120; // 20px padding between bubbles

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
          node.vx *= .5;
          node.vy *= .5;

          node.xpos += node.vx;
          node.ypos += node.vy;

          this.drawNode(node);
        }
      }  start() {
      this.update()
      this.animationFrameId = requestAnimationFrame(() => this.start());
    }
    stop() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }

}
