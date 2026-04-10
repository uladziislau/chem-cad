export interface IGraphNode<T> {
  id: string;
  data: T;
}

export interface IGraphEdge<T> {
  id: string;
  sourceId: string;
  targetId: string;
  data: T;
}

export interface IGraph<N extends IGraphNode<unknown>, E extends IGraphEdge<unknown>> {
  addNode(node: N): void;
  addEdge(edge: E): void;
  getNodes(): N[];
  getEdges(): E[];
  getAdjacentNodes(nodeId: string): N[];
  hasCycles(): boolean;
}
