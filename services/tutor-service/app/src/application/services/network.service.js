/**
 * Graph of REAL direct connections (chat or booking) of a user, expanded to 2 hops:
 * my direct contacts plus the direct contacts of those people. No similarity scoring: topics/specialties
 * never create an edge.
 */
export class NetworkService {
  constructor({ networkRepository }) {
    this.networkRepository = networkRepository;
  }

  async buildGraph(userId) {
    const seen = new Set();
    const edges = [];
    const nodeIds = new Set([userId]);

    const addEdge = (edge) => {
      const key = `${edge.source}|${edge.target}|${edge.type}`;
      if (seen.has(key)) return;
      seen.add(key);
      edges.push(edge);
    };

    // Hop 1: my direct connections
    const hop1Targets = new Set();
    for (const edge of await this.networkRepository.directEdgesFor([userId])) {
      addEdge(edge);
      nodeIds.add(edge.target);
      hop1Targets.add(edge.target);
    }

    // Hop 2: direct connections of my contacts (even if I do not know the other person)
    if (hop1Targets.size > 0) {
      for (const edge of await this.networkRepository.directEdgesFor([...hop1Targets])) {
        if (edge.target === userId) continue; // already represented by my own direct edge
        addEdge(edge);
        nodeIds.add(edge.target);
      }
    }

    nodeIds.delete(userId);
    const nodes = nodeIds.size > 0 ? await this.networkRepository.nodesFor([...nodeIds]) : [];

    // Inactive/deleted users have no node, so an edge pointing at them would dangle (graph libraries
    // fail on links to unknown nodes). The Python service returned those edges anyway.
    const known = new Set([userId, ...nodes.map((n) => n.userId)]);
    return { userId, nodes, edges: edges.filter((e) => known.has(e.source) && known.has(e.target)) };
  }
}
