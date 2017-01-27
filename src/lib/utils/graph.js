export class Graph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  addNode(node) {
    if (this.nodes.get(node.id) === undefined) {
      this.nodes.set(node.id, node);
    }
  }

  addEdge(edge) {
    if (this.edges.get(edge.id) === undefined) {
      this.edges.set(edge.id, edge);
    }
  }

  resetDistance() {
    for (const node in this.nodes.values()) {
      node.distance = Infinity;
    }
    for (const edge in this.edges.values()) {
      edge.distance = Infinity;
    }
  }
}
export class GraphNode {
  constructor({id, type}) {
    this.id = id;
    this.type = type;
    this.adjacentSet = new Set();
    this.distance = Infinity;
    this.degree = 0;
    this.attributes = {};
  }

  addAdjacentNode(node) {
    this.adjacentSet.add(node);
    this.degree++;
  }

  addAttributes({entry}) {
  }
}

export class GraphEdge {
  constructor({id, node0, node1, type}) {
    this.id = id;
    this.node0 = node0;
    this.node1 = node1;
    this.type = type;
    this.distance = Infinity;
    this.strength = 1;
  }
}

class GraphLayout {
  constructor({id, graph}) {
    this.id = id;
    this.graph = graph;
    this.startStep = 0;
    this.currentStep = 0;
    this.startTime = new Date();
    this.currentTime = this.startTime;
    this.dt = 0.0;
  }
}

export class ForceDirectedGraphLayout {
  constructor({id, graph}) {
  }
}
