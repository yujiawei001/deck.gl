/* global document, window*/
import 'babel-polyfill';

import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import DeckGL from 'deck.gl/react';
import FileLoader from 'deck.gl/lib/utils/file-loader';

import {GraphEdge, GraphNode, Graph, GraphLayoutForceDirected} from 'deck.gl/layers/infovis/graph-layer/graph-utils';
import {GraphLayer} from 'deck.gl';

class Root extends Component {
  constructor(props) {
    super(props);

    /* graph */
    FileLoader.loadCSVs([
      './private_data/ugraph/device_node.csv',
      './private_data/ugraph/driver_node.csv',
      './private_data/ugraph/driver_trip_edge.csv',
      './private_data/ugraph/payment_node.csv',
      './private_data/ugraph/rider_node.csv',
      './private_data/ugraph/rider_trip_edge.csv',
      './private_data/ugraph/trip_node.csv',
      './private_data/ugraph/user_device_edge.csv',
      './private_data/ugraph/user_payment_edge.csv'
    ],
    this._onGraphDataLoaded.bind(this));

    this.state = {
      width: 0,
      height: 0
    };
  }
  componentWillMount() {
    window.addEventListener('resize', this._onResize.bind(this));
    this._onResize();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._onResize.bind(this));
  }

  _onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.setState({
      width,
      height
    });
  }

  // Generate graph from loaded CSVs
  _onGraphDataLoaded(data) {
    console.log('graph data loaded');
    const driverNodes = data.get('./private_data/ugraph/driver_node.csv');
    const riderNodes = data.get('./private_data/ugraph/rider_node.csv');
    const tripNodes = data.get('./private_data/ugraph/trip_node.csv');
    const driverTripEdges = data.get('./private_data/ugraph/driver_trip_edge.csv');
    const riderTripEdges = data.get('./private_data/ugraph/rider_trip_edge.csv');
    const userDeviceEdges = data.get('./private_data/ugraph/user_device_edge.csv');
    const deviceNodes = data.get('./private_data/ugraph/device_nodes.csv');

    const graph = new Graph();
    const riderMap = new Set();
    const driverMap = new Set();

    const driverTripMap = new Map();
    const riderTripMap = new Map();

    for (let i = 0; i < driverNodes.length; i++) {
      driverMap.add(driverNodes[i].user_uuid);
    }

    for (let i = 0; i < riderNodes.length; i++) {
      riderMap.add(riderNodes[i].user_uuid);
    }

    for (let i = 0; i < driverTripEdges.length; i++) {
      driverTripMap.set(driverTripEdges[i].trip_uuid, driverTripEdges[i].user_uuid);
    }

    for (let i = 0; i < riderTripEdges.length; i++) {
      riderTripMap.set(riderTripEdges[i].trip_uuid, riderTripEdges[i].user_uuid);
    }

    for (let i = 0; i < userDeviceEdges.length; i++) {
      const edge = userDeviceEdges[i];
      let graphNode0 = graph.nodes.get(edge.user_uuid);
      let graphNode1 = graph.nodes.get(edge.device_uuid);

      if (graphNode0 === undefined) {
        if (driverMap.has(edge.user_uuid)) {
          graphNode0 = new GraphNode({id: edge.user_uuid, type: 'driver'});
        } else if (riderMap.has(edge.user_uuid)) {
          graphNode0 = new GraphNode({id: edge.user_uuid, type: 'rider'});
        } else {
          graphNode0 = new GraphNode({id: edge.user_uuid, type: 'user'});
        }
        graph.addNode(graphNode0);
      }

      if (graphNode1 === undefined) {
        graphNode1 = new GraphNode({id: edge.device_uuid, type: 'device'});
        graph.addNode(graphNode1);
      }

      graphNode0.addAdjacentNode(graphNode1);
      graphNode1.addAdjacentNode(graphNode0);

      let graphEdge0 = new GraphEdge({id: graphNode0.id + '_' + graphNode1.id, node0: graphNode0, node1: graphNode1, type: 'user_device'})

      graph.addEdge(graphEdge0);
    }

    for (let i = 0; i < driverTripEdges.length; i++) {
      const edge = driverTripEdges[i];

      let graphNode0 = graph.nodes.get(edge.user_uuid);
      let riderUUID = riderTripMap.get(edge.trip_uuid);
      if (riderUUID === undefined) {
        continue;
      }

      let graphNode1 = graph.nodes.get(riderUUID);

      if (graphNode0 === undefined) {
        graphNode0 = new GraphNode({id: edge.user_uuid, type: 'driver'});
        graph.addNode(graphNode0);
      }

      if (graphNode1 === undefined) {
        graphNode1 = new GraphNode({id: edge.trip_uuid, type: 'trip'});
        graph.addNode(graphNode1);
      }

      graphNode0.addAdjacentNode(graphNode1);
      graphNode1.addAdjacentNode(graphNode0);

      const graphEdge0 = new GraphEdge({id: graphNode0.id + '_' + graphNode1.id, node0: graphNode0, node1: graphNode1, type: 'driver_trip'});

      graph.addEdge(graphEdge0);
    }

    for (let i = 0; i < riderTripEdges.length; i++) {
      const edge = riderTripEdges[i];

      let graphNode0 = graph.nodes.get(edge.user_uuid);
      let graphNode1 = graph.nodes.get(edge.trip_uuid);

      if (graphNode0 === undefined) {
        graphNode0 = new GraphNode({id: edge.user_uuid, type: 'rider'});
        graph.addNode(graphNode0);
      }

      if (graphNode1 === undefined) {
        graphNode1 = new GraphNode({id: edge.trip_uuid, type: 'trip'});
        graph.addNode(graphNode1);
      }

      graphNode0.addAdjacentNode(graphNode1);
      graphNode1.addAdjacentNode(graphNode0);

      const graphEdge0 = new GraphEdge({id: graphNode0.id + '_' + graphNode1.id, node0: graphNode0, node1: graphNode1, type: 'user_trip'});

      graph.addEdge(graphEdge0);
    }

    // const graphLayer = new GraphLayer({
    //   id: 'graph-scatterplot3D-gpu',
    //   data: graph,
    //   dof: 3,
    //   numHops: 6
    // });

    const subgraph = graph.generateSubGraph({numHops: 3});

    subgraph.setLayout(new GraphLayoutForceDirected({id: 'force-directed', graph: subgraph, dof: 3}));

    this.setState({
      graph: subgraph
    });

    setInterval(this._handleTimerUpdate.bind(this), 16);
    console.log("this.state.graph", this.state.graph);
  }

  _handleTimerUpdate() {
    this.setState({
      currentTime: new Date()
    });
  }

  render() {
    const {width, height, graph} = this.state;
    if (width <= 0 || height <= 0 || !graph) {
      return null;
    }

    //graph.layoutStep();

    const layers = [
      new GraphLayer({
        id: 'graph-3D',
        data: graph
      })
    ];

    return (
      <DeckGL
        width={width}
        height={height}
        layers={layers}
        debug />
    );
  }
}


const container = document.createElement('div');
document.body.appendChild(container);

ReactDOM.render(<Root />, container);
