export interface GraphNode {
    id: string;
    role: string;
    lines: number;
  }
  
  export interface GraphEdge {
    source: string;
    target: string;
  }
  
  export interface ArchitectureGraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
  }