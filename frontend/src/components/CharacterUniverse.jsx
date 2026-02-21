// DevHacks 2026 - Challenge 2: AI-Powered Writer
// File: frontend/src/components/CharacterUniverse.jsx
// THE SHOWSTOPPER — 3D force-directed character graph using Three.js
 
import { useRef, useState, useEffect, useCallback } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
 
export default function CharacterUniverse({ nodes, edges, issues }) {
  const fgRef           = useRef();
  const [tooltip, setTooltip] = useState(null);
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const containerRef    = useRef();
 
  // Resize observer to fill container
  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => {
      setDimensions({
        w: entry.contentRect.width,
        h: entry.contentRect.height,
      });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);
 
  // Slow auto-rotation for ambient effect
  useEffect(() => {
    let angle = 0;
    const interval = setInterval(() => {
      if (fgRef.current) {
        angle += 0.003;
        fgRef.current.cameraPosition({
          x: Math.sin(angle) * 400,
          z: Math.cos(angle) * 400,
        });
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);
 
  // Build graph data format for react-force-graph-3d
  const graphData = {
    nodes: nodes.map(n => ({ ...n, id: n.id })),
    links: edges.map(e => ({
      source: e.source,
      target: e.target,
      color : e.color,
      label : e.label,
      value : e.value,
    })),
  };
 
  // Custom 3D node object — glowing sphere with ring for flagged characters
  const nodeThreeObject = useCallback((node) => {
    const group = new THREE.Group();
 
    // Core sphere
    const geo    = new THREE.SphereGeometry(node.hasIssue ? 8 : 6, 32, 32);
    const mat    = new THREE.MeshStandardMaterial({
      color            : node.hasIssue ? 0xef4444 : 0x22d3ee,
      emissive         : node.hasIssue ? 0xef4444 : 0x22d3ee,
      emissiveIntensity: 0.6,
      roughness        : 0.2,
      metalness        : 0.8,
    });
    const sphere = new THREE.Mesh(geo, mat);
    group.add(sphere);
 
    // Outer glow ring for flagged (problematic) characters
    if (node.hasIssue) {
      const ringGeo = new THREE.RingGeometry(10, 12, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color      : 0xef4444,
        side       : THREE.DoubleSide,
        transparent: true,
        opacity    : 0.4,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
 
      // Pulsing outer ring
      const outerGeo = new THREE.RingGeometry(13, 14, 32);
      const outerMat = new THREE.MeshBasicMaterial({
        color      : 0xef4444,
        side       : THREE.DoubleSide,
        transparent: true,
        opacity    : 0.2,
      });
      const outerRing = new THREE.Mesh(outerGeo, outerMat);
      outerRing.rotation.x = Math.PI / 2;
      group.add(outerRing);
    }
 
    // Floating text label above node
    const canvas  = document.createElement("canvas");
    canvas.width  = 256;
    canvas.height = 64;
    const ctx     = canvas.getContext("2d");
 
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0, 0, 256, 64);
 
    ctx.font         = "700 20px 'Playfair Display', serif";
    ctx.fillStyle    = node.hasIssue ? "#ef4444" : "#22d3ee";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.name, 128, 32);
 
    const texture  = new THREE.CanvasTexture(canvas);
    const spriteMat= new THREE.SpriteMaterial({
      map        : texture,
      transparent: true,
    });
    const sprite   = new THREE.Sprite(spriteMat);
    sprite.scale.set(40, 10, 1);
    sprite.position.set(0, 14, 0);
    group.add(sprite);
 
    return group;
  }, []);
 
  // Particle effect on links — dashed emissive lines
  const linkThreeObject = useCallback((link) => {
    const start  = link.source;
    const end    = link.target;
    if (!start || !end) return null;
 
    const points = [
      new THREE.Vector3(start.x || 0, start.y || 0, start.z || 0),
      new THREE.Vector3(end.x   || 0, end.y   || 0, end.z   || 0),
    ];
    const geo  = new THREE.BufferGeometry().setFromPoints(points);
    const mat  = new THREE.LineBasicMaterial({
      color      : link.color || "#4b5563",
      transparent: true,
      opacity    : 0.6,
      linewidth  : link.value || 1,
    });
    return new THREE.Line(geo, mat);
  }, []);
 
  const handleNodeHover = useCallback((node) => {
    document.body.style.cursor = node ? "pointer" : "default";
    if (node) {
      const issue = issues?.find(i => i.character === node.name);
      setTooltip({
        name       : node.name,
        appearances: node.appearances,
        hasIssue   : node.hasIssue,
        issue      : issue?.message,
      });
    } else {
      setTooltip(null);
    }
  }, [issues]);
 
  const handleNodeClick = useCallback((node) => {
    if (fgRef.current) {
      fgRef.current.cameraPosition(
        { x: node.x * 1.5, y: node.y * 1.5, z: node.z * 1.5 },
        node,
        1200
      );
    }
  }, []);
 
  return (
    <div className="universe-container" ref={containerRef}>
      {/* Header */}
      <div className="universe-header">
        <div className="universe-title">Character Universe</div>
        <div className="universe-legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: "#22d3ee" }} />
            Clean Character
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: "#ef4444" }} />
            Has Issue
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: "#f59e0b" }} />
            Strong Relationship
          </div>
        </div>
      </div>
 
      {/* 3D Force Graph */}
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        width={dimensions.w}
        height={dimensions.h}
        backgroundColor="transparent"
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={false}
        onNodeHover={handleNodeHover}
        onNodeClick={handleNodeClick}
        linkColor={link => link.color || "#4b5563"}
        linkWidth={link => link.value || 1}
        linkOpacity={0.5}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.004}
        linkDirectionalParticleWidth={link => link.value > 2 ? 2 : 1}
        linkDirectionalParticleColor={() => "#f59e0b"}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        enableNodeDrag={true}
        enableNavigationControls={true}
        showNavInfo={false}
      >
        {/* Ambient lighting for Three.js scene */}
        <ambientLight intensity={0.4} />
        <pointLight position={[200, 200, 200]} intensity={1.2} color="#22d3ee" />
        <pointLight position={[-200, -200, 100]} intensity={0.8} color="#f59e0b" />
      </ForceGraph3D>
 
      {/* Hover Tooltip */}
      {tooltip && (
        <div className="universe-tooltip">
          <div className="tooltip-name">{tooltip.name}</div>
          <div className="tooltip-detail">
            Appears in {tooltip.appearances} paragraph(s)
            {tooltip.hasIssue && (
              <div style={{ color: "#ef4444", marginTop: 6 }}>
                ⚠️ {tooltip.issue}
              </div>
            )}
          </div>
        </div>
      )}
 
      <div className="universe-instructions">
        Drag to rotate · Scroll to zoom<br />
        Click a character to focus
      </div>
    </div>
  );
}
