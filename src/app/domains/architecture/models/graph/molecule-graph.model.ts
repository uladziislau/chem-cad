import { IGraph, IGraphNode, IGraphEdge } from './graph.interface';
import { IAtom } from '../atom.interface';
import { IBond } from '../bond.interface';

export class AtomNode implements IGraphNode<IAtom> {
  constructor(public id: string, public data: IAtom) {}
}

export class BondEdge implements IGraphEdge<IBond> {
  constructor(
    public id: string,
    public sourceId: string,
    public targetId: string,
    public data: IBond
  ) {}
}

export class MoleculeGraph implements IGraph<AtomNode, BondEdge> {
  private nodes = new Map<string, AtomNode>();
  private edges = new Map<string, BondEdge>();
  private adjacencyList = new Map<string, string[]>();

  addNode(node: AtomNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, []);
    }
  }

  addEdge(edge: BondEdge): void {
    this.edges.set(edge.id, edge);
    
    // Неориентированный граф (связь работает в обе стороны)
    this.adjacencyList.get(edge.sourceId)?.push(edge.targetId);
    this.adjacencyList.get(edge.targetId)?.push(edge.sourceId);
  }

  getNodes(): AtomNode[] {
    return Array.from(this.nodes.values());
  }

  getEdges(): BondEdge[] {
    return Array.from(this.edges.values());
  }

  getAdjacentNodes(nodeId: string): AtomNode[] {
    const neighborIds = this.adjacencyList.get(nodeId) || [];
    return neighborIds.map(id => this.nodes.get(id)!).filter(n => !!n);
  }

  // Инновация: Алгоритмический поиск циклов (Основа для определения ароматичности)
  hasCycles(): boolean {
    const visited = new Set<string>();
    
    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (this.dfsCheckCycle(nodeId, null, visited)) {
          return true;
        }
      }
    }
    return false;
  }

  private dfsCheckCycle(currentId: string, parentId: string | null, visited: Set<string>): boolean {
    visited.add(currentId);

    const neighbors = this.adjacencyList.get(currentId) || [];
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        if (this.dfsCheckCycle(neighborId, currentId, visited)) {
          return true;
        }
      } else if (neighborId !== parentId) {
        // Если сосед уже посещен и это не тот узел, откуда мы пришли -> мы нашли цикл!
        return true;
      }
    }

    return false;
  }

  // Вычисление степени вершины (сколько связей у атома в графе)
  getDegree(nodeId: string): number {
    return this.adjacencyList.get(nodeId)?.length || 0;
  }
}
