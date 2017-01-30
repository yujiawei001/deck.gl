export class GraphNode {
  constructor({id, type}) {
    this.id = id;
    this.adjacentSet = new Set();
    this.distance = Infinity;
    this.degree = 0;
    this.attributes = {type};
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
    this.distance = Infinity;
    this.attributes = {type, strength: 1};
  }

  addAttributes({entry}) {
  }

}

export class Graph {
  constructor({parentGraph} = {}) {
    this.nodes = new Map();
    this.edges = new Map();

    // Helper tables
    // node id -> node index. This is useful for constructing edge line indices
    this.nodeIndexMap = new Map();
    // node index -> node. This is useful for picking
    this.nodeMap = new Map();

    this.edgeIndexMap = new Map();
    this.edgeIDMap = new Map();

    this.edgeNodeIndex = new Array();

    this.numberOfNodes = 0;
    this.numberOfEdges = 0;

    this.parentGraph = parentGraph;
    this.isSubGraph = parentGraph ? true : false;

    this.layout = null;
    this.layoutRunning = false;

    this.dataStructureChanged = false;
    this.dataChanged = false;

    setInterval(this.layoutStep.bind(this), 16);

  }

  addNode(node) {
    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, node);
      this.numberOfNodes++;
      this.dataStructureChanged = true;
    }
  }

  addEdge(edge) {
    if (!this.edges.has(edge.id)) {
      this.edges.set(edge.id, edge);
      this.numberOfEdges++;
      this.dataStructureChanged = true;
    }
  }

  _resetDistance() {
    for (const node in this.nodes.values()) {
      node.distance = Infinity;
    }
    for (const edge in this.edges.values()) {
      edge.distance = Infinity;
    }
  }

  setLayout(layout) {
    this.layout = layout;
  }

  layoutStep() {
    if (this.layoutRunning) {
      this.layout.step();
      this.dataChanged = true;
    }
  }

  startLayout() {
    this.layoutRunning = true;
  }

  pauseLayout() {
    this.layoutRunning = false;
  }

  resetLayout() {

  }

  isDataChanged() {
    return this.isDataChanged;
  }

  isDataStructureChanged() {
    return this.isDataStructureChanged;
  }

  generateSubGraph({startNodeID, numHops = 3}) {

    if (startNodeID === undefined) {
      let maxEdge = 0;
      let maxNodeID;

      for (const [key, node] of this.nodes) {
        if (node.degree > maxEdge && node.attributes.type === 'driver') {
          maxEdge = node.adjacentSet.size;
          maxNodeID = key;
        }
      }
      startNodeID = maxNodeID;
    }

    this._resetDistance();

    this.subGraph = new Graph({parentGraph: this});
    let nodeCount = 0;
    let edgeCount = 0;

    // Breadth first search for the first 'this.state.numHops' nodes from the start node
    const root = this.nodes.get(startNodeID);
    root.distance = 0;

    const queue = [root];
    while (queue.length !== 0) {
      const current = queue.shift();
      if (current.distance > numHops) {
        break;
      }
      this.subGraph.nodeIndexMap.set(current.id, nodeCount);
      this.subGraph.nodeMap.set(nodeCount, current);
      this.subGraph.nodes.set(current.id, current);
      nodeCount++;

      for (const item of current.adjacentSet) {
        if (item.distance === Infinity) {
          item.distance = current.distance + 1;
          queue.push(item);
        }

        /* TODO: edges in subGraph.edges contains node with distance = numHops + 1.
        We should fix this... */

        const edge = this._getEdgeIDFromNodes(this.edges, current, item);

        if(edge && !this.subGraph.edgeIndexMap.has(edge.id)) {
          this.subGraph.edgeIndexMap.set(edge.id, edgeCount);
          this.subGraph.edgeIDMap.set(edgeCount, edge.id);
          this.subGraph.edges.set(edge.id, edge);
        }
      }
    }

    // build edgeNodeIndex array for faster force calculations

    for (const edge of this.subGraph.edges.values()) {
      const node0Index = this.subGraph.nodeIndexMap.get(edge.node0.id);
      const node1Index = this.subGraph.nodeIndexMap.get(edge.node1.id);
      if (node0Index !== undefined && node1Index !== undefined) {
        this.subGraph.edgeNodeIndex.push(node0Index);
        this.subGraph.edgeNodeIndex.push(node1Index);
        edgeCount++;
      }
    }

    this.subGraph.numberOfNodes = nodeCount;

    // Process edges

    this.subGraph.numberOfEdges = edgeCount;
    //console.log('subGraph', subGraph);
    return this.subGraph;
  }

  getNodePosition() {
    return this.layout.getNodePosition();
  }

  getNodeColor() {
    return this.layout.getNodeColor();
  }

  getNodeSize() {
    return this.layout.getNodeSize();
  }

  getEdgePosition() {
    return this.layout.getEdgePosition();
  }

  getEdgeColor() {
    return this.layout.getEdgeColor();
  }

  getEdgeNodeIndex() {
    return this.edgeNodeIndex;
  }

  _getEdgeIDFromNodes(edges, node1, node2) {
    if (edges.has(`${node1.id}_${node2.id}`)) {
      return edges.get(`${node1.id}_${node2.id}`);
    }
    if (edges.has(`${node2.id}_${node1.id}`)) {
      return edges.get(`${node2.id}_${node1.id}`);
    }
    return undefined;
  }

  _isEdgeInGraph(graph, node1, node2) {
    return graph.edgeSet.has(`${node1.id}_${node2.id}`) ||
     graph.edgeSet.has(`${node2.id}_${node1.id}`);
  }
}



