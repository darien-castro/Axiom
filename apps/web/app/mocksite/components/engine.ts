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
    this.weight = course.credits // weight...
    this.name = course.name
    this.xpos = 0;
    this.ypos = 0;
    this.vx = 0 // velocity
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

// onclick creation of child nodes
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
    this.ctx = ctx // passing canvas context so we can draw on it
  }
  private animationFrameId: number | null = null;
  screenSize: { width: number; height: number }
  gravity: number // some arbitrary number
  nodes: physNode[] = []
  ctx: CanvasRenderingContext2D
  addNode(node: physNode) {
    this.nodes.push(node)
    // setting variable some random position on screen
    node.setPosition(
      Math.floor(Math.random() * this.screenSize.width),
      Math.floor(Math.random() * this.screenSize.height)
    )
  }

  // draw node every frame at the passed nodes position
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
      this.ctx.clearRect(0, 0, this.screenSize.width, this.screenSize.height); // clear canvas every frame

        // gathering middle of screen
      const centerWidth = this.screenSize.width / 2;
      const centerHeight = this.screenSize.height / 2;

        // arbitrary repulsion strength
        const repulsionStrength = .2;


        // apply gravity to all nodes
      for (const node of this.nodes) {
          // calculate distance from center
          const dx = centerWidth - node.xpos;
        const dy = centerHeight - node.ypos;
        // apply gravity pull
          node.vx += dx * this.gravity;
          node.vy += dy * this.gravity;
        }

        // repulsion between all nodes and themselves
        for (let i = 0; i < this.nodes.length; i++) {
          for (let j = i + 1; j < this.nodes.length; j++) {
            const nodeA = this.nodes[i];
            const nodeB = this.nodes[j];

            // math...
            const dx = nodeB.xpos - nodeA.xpos;
            const dy = nodeB.ypos - nodeA.ypos;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // more math...
            const radiusA = nodeA.weight * 5;
            const radiusB = nodeB.weight * 5;
            const minDistance = radiusA + radiusB + 120; // 20px padding between bubbles

            // if the distance is less than minimum, apply repulsion (will happen a lot)
            if (distance < minDistance && distance > 0) {
              const overlap = minDistance - distance;

              // calculate repulsion force
              const pushX = (dx / distance) * overlap * repulsionStrength;
              const pushY = (dy / distance) * overlap * repulsionStrength;

              // apply repulsion force to nodes
              nodeA.vx -= pushX;
              nodeA.vy -= pushY;

              nodeB.vx += pushX;
              nodeB.vy += pushY;
            }
          }
        }

        // apply friction to all nodes (slows them down over time)
        for (const node of this.nodes) {
          node.vx *= .5;
          node.vy *= .5;

          node.xpos += node.vx;
          node.ypos += node.vy;

          this.drawNode(node);
        }
  }
  // start loop
  start() {
      this.update()
      this.animationFrameId = requestAnimationFrame(() => this.start());
  }
  // stop loop
    stop() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
}
