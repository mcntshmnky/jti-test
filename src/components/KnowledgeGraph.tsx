import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { neo4jService } from '../services/neo4jService';

interface Node {
    id: string;
    labels: string[];
    properties: { [key: string]: any };
}

interface Relationship {
    type: string;
    properties: { [key: string]: any };
}

interface GraphData {
    nodes: Node[];
    relationships: Relationship[];
}

const KnowledgeGraph: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const fetchAndRenderGraph = async () => {
            try {
                const data = await neo4jService.getGraphData();
                
                const nodes: Node[] = [];
                const links: any[] = [];
                
                data.forEach(record => {
                    record.nodes.forEach((node: any) => {
                        if (node && !nodes.find(n => n.id === node.identity.toString())) {
                            nodes.push({
                                id: node.identity.toString(),
                                labels: node.labels,
                                properties: node.properties
                            });
                        }
                    });
                    
                    record.relationships.forEach((rel: any) => {
                        if (rel) {
                            links.push({
                                source: rel.start.toString(),
                                target: rel.end.toString(),
                                type: rel.type,
                                properties: rel.properties
                            });
                        }
                    });
                });

                const width = 800;
                const height = 600;

                d3.select(svgRef.current).selectAll("*").remove();

                const svg = d3.select(svgRef.current)
                    .attr('width', width)
                    .attr('height', height);

                const simulation = d3.forceSimulation(nodes)
                    .force('link', d3.forceLink(links).id((d: any) => d.id).distance(150))
                    .force('charge', d3.forceManyBody().strength(-400))
                    .force('center', d3.forceCenter(width / 2, height / 2));

                // Create links with different styles based on relationship type
                const link = svg.append('g')
                    .selectAll('line')
                    .data(links)
                    .enter()
                    .append('line')
                    .attr('stroke', (d: any) => {
                        if (d.type === 'TRIGGERS') return '#ff7f0e';
                        if (d.type === 'RELATES_TO') return '#1f77b4';
                        return '#999';
                    })
                    .attr('stroke-opacity', 0.6)
                    .attr('stroke-width', (d: any) => d.properties?.weight ? d.properties.weight * 3 : 2);

                // Create nodes with different colors based on labels
                const node = svg.append('g')
                    .selectAll('circle')
                    .data(nodes)
                    .enter()
                    .append('circle')
                    .attr('r', (d: any) => d.properties?.intensity ? d.properties.intensity * 15 : 10)
                    .attr('fill', (d: any) => {
                        if (d.labels.includes('Emotion')) return '#69c0ff';
                        if (d.labels.includes('Trigger')) return '#95de64';
                        return '#ffc069';
                    })
                    .call(d3.drag<any, any>()
                        .on('start', dragstarted)
                        .on('drag', dragged)
                        .on('end', dragended));

                // Add labels
                const label = svg.append('g')
                    .selectAll('text')
                    .data(nodes)
                    .enter()
                    .append('text')
                    .text((d: any) => d.properties.name)
                    .attr('font-size', 12)
                    .attr('dx', 12)
                    .attr('dy', 4);

                // Add relationship labels
                const linkLabel = svg.append('g')
                    .selectAll('text')
                    .data(links)
                    .enter()
                    .append('text')
                    .text((d: any) => d.type)
                    .attr('font-size', 10)
                    .attr('fill', '#666');

                simulation.on('tick', () => {
                    link
                        .attr('x1', (d: any) => d.source.x)
                        .attr('y1', (d: any) => d.source.y)
                        .attr('x2', (d: any) => d.target.x)
                        .attr('y2', (d: any) => d.target.y);

                    node
                        .attr('cx', (d: any) => d.x)
                        .attr('cy', (d: any) => d.y);

                    label
                        .attr('x', (d: any) => d.x)
                        .attr('y', (d: any) => d.y);

                    linkLabel
                        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
                        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);
                });

                function dragstarted(event: any, d: any) {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                }

                function dragged(event: any, d: any) {
                    d.fx = event.x;
                    d.fy = event.y;
                }

                function dragended(event: any, d: any) {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }

            } catch (error) {
                console.error('Error fetching or rendering graph:', error);
            }
        };

        fetchAndRenderGraph();

        return () => {
            neo4jService.close();
        };
    }, []);

    return (
        <div className="knowledge-graph">
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default KnowledgeGraph; 