// // D3DModel.jsx  — drop-in replacement
// import React, { useState, useRef, useEffect, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import { Canvas, useFrame } from "@react-three/fiber";
// import {
//   OrbitControls,
//   PresentationControls,
//   Environment,
//   ContactShadows,
//   AdaptiveDpr,
//   PerformanceMonitor,
//   useGLTF,
// } from "@react-three/drei";
// import * as THREE from "three";
// import KidsSidebar from "./KidsSidebar";
// import lisaViseme from "./model/girl.glb";

// /** ---------- 3D Head with smooth viseme blending + auto mesh detection ---------- */
// function VisemeHead({ currentViseme }) {
//   const { scene, materials } = useGLTF(lisaViseme);
//   const groupRef = useRef(null);
//   const headMeshRef = useRef(null);

//   // Try to find the first mesh in the scene that actually has morph targets
//   useEffect(() => {
//     let found = null;
//     scene.traverse((o) => {
//       if (!found && o.isMesh && o.morphTargetDictionary && o.morphTargetInfluences) {
//         found = o;
//       }
//       // nice defaults for PBR + shadows
//       if (o.isMesh) {
//         o.castShadow = true;
//         o.receiveShadow = true;
//         if (o.material && "envMapIntensity" in o.material) o.material.envMapIntensity = 0.8;
//       }
//     });
//     headMeshRef.current = found || null;
//   }, [scene]);

//   // Tasteful material tuning if these materials exist
//   useEffect(() => {
//     const skin = materials?.["Skin.001"];
//     if (skin) {
//       skin.color = new THREE.Color(0xffebd5);
//       skin.metalness = 0.05;
//       skin.roughness = 0.35;
//       skin.emissive = new THREE.Color(0xfff2e0);
//       skin.emissiveIntensity = 0.08;
//     }
//     const lips = materials?.Lips;
//     if (lips) {
//       lips.color = new THREE.Color(0x9a3f3f);
//       lips.roughness = 0.25;
//       lips.metalness = 0.05;
//     }
//     const eyes = materials?.Eyes;
//     if (eyes) {
//       eyes.color = new THREE.Color(0xffffff);
//       eyes.roughness = 0.1;
//       eyes.metalness = 0.3;
//     }
//   }, [materials]);

//   // Candidate viseme aliases → we’ll resolve to actual morph target names that exist
//   const visemeAliases = useMemo(
//     () => ({
//       A: ["AA", "Aletter"],
//       B: ["pp", "LipsUpperClose"],
//       C: ["kk", "CH"],
//       D: ["dd"],
//       E: ["EE"],
//       F: ["ff", "LipsFunnel"],
//       G: ["kk"],
//       H: ["IH"],
//       I: ["IH"],
//       J: ["CH"],
//       K: ["kk"],
//       L: ["dd"],
//       M: ["pp"],
//       N: ["nn"],
//       O: ["OH"],
//       P: ["pp"],
//       Q: ["kk", "OU"],
//       R: ["rr"],
//       S: ["ss"],
//       T: ["dd", "TH"],
//       U: ["OU"],
//       V: ["ff", "LipsFunnel"],
//       W: ["OU"],
//       X: ["kk", "ss"],
//       Y: ["IH", "EE"],
//       Z: ["ss"],
//     }),
//     []
//   );

//   // Smooth blend state
//   const targetsRef = useRef(null);

//   useFrame((state, delta) => {
//     // elegant idle motion
//     if (groupRef.current) {
//       const t = state.clock.getElapsedTime();
//       groupRef.current.rotation.y = THREE.MathUtils.degToRad(Math.sin(t * 0.2) * 3);
//       groupRef.current.rotation.z = THREE.MathUtils.degToRad(1);
//       groupRef.current.position.y = Math.sin(t * 0.8) * 0.005;
//     }

//     const head = headMeshRef.current;
//     if (!head || !head.morphTargetInfluences || !head.morphTargetDictionary) return;

//     const infl = head.morphTargetInfluences;
//     const dict = head.morphTargetDictionary;

//     // Lazily create a target array we can lerp toward
//     if (!targetsRef.current || targetsRef.current.length !== infl.length) {
//       targetsRef.current = new Array(infl.length).fill(0);
//     }
//     const targets = targetsRef.current;

//     // Reset all target weights to 0
//     for (let i = 0; i < targets.length; i++) targets[i] = 0;

//     // Resolve aliases -> actual morph target names that exist in this model
//     if (currentViseme && visemeAliases[currentViseme]) {
//       const candidates = visemeAliases[currentViseme];
//       for (const c of candidates) {
//         const idx = dict[c];
//         if (idx !== undefined) targets[idx] = 1; // we only set the ones that actually exist
//       }
//     }

//     // Damp (smooth) current influences toward targets
//     for (let i = 0; i < infl.length; i++) {
//       infl[i] = THREE.MathUtils.damp(infl[i], targets[i], 12, delta);
//     }
//   });

//   return (
//     <group ref={groupRef} scale={3} position={[0, -0.1, 0]}>
//       <primitive object={scene} />
//     </group>
//   );
// }

// useGLTF.preload(lisaViseme);

// /** ------------------------------ Page ------------------------------ */
// export default function D3DModel() {
//   const navigate = useNavigate();
//   const [currentViseme, setCurrentViseme] = useState(null);
//   const [viewMode, setViewMode] = useState("ALL");

//   const alphabets = useMemo(() => "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), []);
//   const vowels = useMemo(() => ["A", "E", "I", "O", "U"], []);
//   const consonants = useMemo(() => alphabets.filter((l) => !vowels.includes(l)), [alphabets, vowels]);
//   const displayedLetters =
//     viewMode === "VOWELS" ? vowels : viewMode === "CONSONANTS" ? consonants : alphabets;

//   const speak = (text) => {
//     try {
//       const utterance = new SpeechSynthesisUtterance(text);
//       utterance.lang = "en-US";
//       // Map Web Speech char boundary → our coarse viseme
//       utterance.onboundary = (event) => {
//         const char = text[event.charIndex]?.toUpperCase();
//         if (char && /[A-Z]/.test(char)) setCurrentViseme(char);
//       };
//       utterance.onend = () => setCurrentViseme(null);
//       speechSynthesis.cancel();
//       speechSynthesis.speak(utterance);
//     } catch {
//       // if speech synthesis isn’t available, just flash the viseme briefly
//       setCurrentViseme(text?.[0]?.toUpperCase() || null);
//       setTimeout(() => setCurrentViseme(null), 300);
//     }
//   };

//   return (
//     <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>
//       <KidsSidebar />

//       <div style={{ flex: 1, position: "relative", background: "linear-gradient(135deg, #EEE 0%, #D4BEE4 100%)" }}>
//         <Canvas
//           shadows
//           dpr={[1, 2]}
//           camera={{ position: [0.15, 0.1, 4.2], fov: 40 }}
//           onCreated={({ gl }) => {
//             gl.toneMapping = THREE.ACESFilmicToneMapping;
//             // for three >= 0.150: gl.outputColorSpace
//             if ("outputColorSpace" in gl) gl.outputColorSpace = THREE.SRGBColorSpace;
//             gl.setClearColor(0xede9fe, 1); // soft lilac bg to blend with UI
//           }}
//         >
//           {/* Auto-adapt performance on weaker devices */}
//           <PerformanceMonitor onChange={({ factor }) => { /* factor ∈ (0..1] */ }}>
//             <AdaptiveDpr pixelated />
//           </PerformanceMonitor>

//           {/* Lighting & environment */}
//           <ambientLight intensity={0.6} />
//           <directionalLight
//             castShadow
//             position={[3, 5, 3]}
//             intensity={1.2}
//             shadow-mapSize-width={2048}
//             shadow-mapSize-height={2048}
//           />
//           <Environment preset="studio" />

//           {/* Natural interaction feel */}
//           <PresentationControls
//             global
//             config={{ mass: 1, tension: 180, friction: 22 }}
//             snap={{ mass: 1, tension: 300, friction: 30 }}
//             rotation={[0, 0, 0]}
//             polar={[THREE.MathUtils.degToRad(-5), THREE.MathUtils.degToRad(15)]}
//             azimuth={[THREE.MathUtils.degToRad(-30), THREE.MathUtils.degToRad(30)]}
//           >
//             <VisemeHead currentViseme={currentViseme} />
//           </PresentationControls>

//           {/* Optional: keep for manual camera movement */}
//           <OrbitControls enablePan enableZoom enableRotate makeDefault={false} />

//           {/* Elegant ground contact */}
//           <ContactShadows
//             position={[0, -1.1, 0]}
//             opacity={0.35}
//             scale={10}
//             blur={2.5}
//             far={4}
//           />
//         </Canvas>

//         {/* Alphabet Controls */}
//         <div
//           style={{
//             position: "absolute",
//             bottom: 30,
//             left: "50%",
//             transform: "translateX(-50%)",
//             display: "flex",
//             flexWrap: "wrap",
//             gap: 10,
//             maxWidth: "85%",
//             justifyContent: "center",
//           }}
//         >
//           {displayedLetters.map((l) => (
//             <button
//               key={l}
//               onClick={() => speak(l)}
//               style={{
//                 fontSize: "1.5rem",
//                 padding: "12px 16px",
//                 borderRadius: 12,
//                 border: "none",
//                 background: currentViseme === l ? "#5C2E91" : "#3B1E54",
//                 color: "#EEEEEE",
//                 fontWeight: 700,
//                 cursor: "pointer",
//                 boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
//                 transition: "transform 0.2s ease, background 0.2s ease",
//               }}
//               onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
//               onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
//             >
//               {l}
//             </button>
//           ))}
//         </div>

//         {/* View Mode Selector */}
//         <div
//           style={{
//             position: "absolute",
//             top: 20,
//             left: "50%",
//             transform: "translateX(-50%)",
//             display: "flex",
//             gap: 12,
//             backdropFilter: "blur(6px)",
//             background: "rgba(255,255,255,0.5)",
//             borderRadius: 12,
//             padding: "6px 10px",
//             boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
//           }}
//         >
//           {["ALL", "VOWELS", "CONSONANTS"].map((mode) => (
//             <button
//               key={mode}
//               onClick={() => setViewMode(mode)}
//               style={{
//                 padding: "8px 14px",
//                 borderRadius: 10,
//                 border: "1px solid #9B7EBD",
//                 background: viewMode === mode ? "#9B7EBD" : "#FFFFFF",
//                 color: viewMode === mode ? "#FFFFFF" : "#3B1E54",
//                 fontWeight: 700,
//                 cursor: "pointer",
//                 transition: "all 0.2s ease",
//                 boxShadow: viewMode === mode ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
//               }}
//             >
//               {mode}
//             </button>
//           ))}
//         </div>

//         {/* AI Assistant Button */}
//         <button
//           style={{
//             position: "absolute",
//             bottom: 20,
//             right: 20,
//             padding: "14px 24px",
//             borderRadius: 50,
//             background: "#9B7EBD",
//             color: "#EEEEEE",
//             border: "none",
//             fontSize: "1rem",
//             fontWeight: 700,
//             cursor: "pointer",
//             boxShadow: "0px 6px 18px rgba(0,0,0,0.2)",
//             transition: "transform 0.2s ease",
//           }}
//           onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
//           onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
//           onClick={() => navigate("/ai-assistant")}
//         >
//           Try AI Assistant
//         </button>
//       </div>
//     </div>
//   );
// }

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import KidsSidebar from "./KidsSidebar";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
// Make sure the path is correct
import lisaViseme from "./model/girl.glb";

function VisemeHead({ currentViseme }) {
  const { scene, nodes, materials } = useGLTF(lisaViseme);
  const headMesh = nodes.Head001;
  const groupRef = useRef();

  if (materials?.["Skin.001"]) {
    const skinMat = materials["Skin.001"];
    skinMat.color.set(new THREE.Color(0xffebd5));
    skinMat.metalness = 0.05;
    skinMat.roughness = 0.35;
    skinMat.emissive.set(new THREE.Color(0xfff2e0));
    skinMat.emissiveIntensity = 0.08;
  }

  if (materials?.Lips) {
    materials.Lips.color.set(new THREE.Color(0x9a3f3f));
    materials.Lips.roughness = 0.25;
    materials.Lips.metalness = 0.05;
  }

  if (materials?.Eyes) {
    materials.Eyes.color.set(new THREE.Color(0xffffff));
    materials.Eyes.roughness = 0.1;
    materials.Eyes.metalness = 0.3;
  }

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.degToRad(0);
      groupRef.current.rotation.z = THREE.MathUtils.degToRad(1);
    }

    if (!headMesh?.morphTargetInfluences || !headMesh.morphTargetDictionary) return;

    headMesh.morphTargetInfluences.fill(0);
    const dict = headMesh.morphTargetDictionary;
    const setInfluence = (name, value) => {
      if (dict[name] !== undefined) headMesh.morphTargetInfluences[dict[name]] = value;
    };

    const visemeMap = {
      A: ["AA", "Aletter"], B: ["pp", "LipsUpperClose"], C: ["kk", "CH"], D: ["dd"],
      E: ["EE"], F: ["ff"], G: ["kk"], H: ["JawOpen"], I: ["IH"], J: ["CH"],
      K: ["kk"], L: ["dd"], M: ["pp"], N: ["nn"], O: ["OH"], P: ["pp"],
      Q: ["kk", "OU"], R: ["rr"], S: ["ss"], T: ["dd", "TH"], U: ["OU"],
      V: ["ff", "LipsFunnel"], W: ["OU"], X: ["kk", "ss"], Y: ["IH", "EE"], Z: ["ss"]
    };

    if (currentViseme && visemeMap[currentViseme]) {
      visemeMap[currentViseme].forEach(v => setInfluence(v, 1));
    }
  });

  // ✅ shrink model + move slightly down
  return <primitive ref={groupRef} object={scene} scale={1} position={[0, 1.3, 0]} />;
}

export default function D3DModel() {
  const navigate = useNavigate();
  const [currentViseme, setCurrentViseme] = useState(null);
  const [viewMode, setViewMode] = useState("ALL");
  const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const vowels = ["A", "E", "I", "O", "U"];
  const consonants = alphabets.filter(l => !vowels.includes(l));
  const displayedLetters =
    viewMode === "VOWELS" ? vowels : viewMode === "CONSONANTS" ? consonants : alphabets;

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";

    utterance.onboundary = (event) => {
      const char = text[event.charIndex]?.toUpperCase();
      if (char) setCurrentViseme(char);
    };
    utterance.onend = () => setCurrentViseme(null);

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  };

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>
      {/* Main Content */}
      <KidsSidebar/>
      <div style={{ flex: 1, position: "relative", background: "linear-gradient(135deg, #EEEEEE 0%, #D4BEE4 100%)" }}>
        {/* ✅ camera moved back & FOV fixed */}
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <ambientLight intensity={1.2} />
          <directionalLight position={[2, 4, 3]} intensity={1.5} />
          <pointLight position={[0, 2, 2]} intensity={1.2} />
          <OrbitControls enablePan enableZoom enableRotate />
          <VisemeHead currentViseme={currentViseme} />
        </Canvas>

        {/* Alphabet Controls */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            maxWidth: "85%",
            justifyContent: "center",
          }}
        >
          {displayedLetters.map((l) => (
            <button
              key={l}
              onClick={() => speak(l)}
              style={{
                fontSize: "1.5rem",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "none",
                background: "#3B1E54",
                color: "#EEEEEE",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {l}
            </button>
          ))}
        </div>

        {/* View Mode Selector */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "12px",
          }}
        >
          {["ALL", "VOWELS", "CONSONANTS"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid #9B7EBD",
                background: viewMode === mode ? "#9B7EBD" : "#EEEEEE",
                color: viewMode === mode ? "#EEEEEE" : "#3B1E54",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: viewMode === mode ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* AI Assistant Button */}
        <button
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            padding: "14px 24px",
            borderRadius: "50px",
            background: "#9B7EBD",
            color: "#EEEEEE",
            border: "none",
            fontSize: "1rem",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0px 6px 18px rgba(0,0,0,0.2)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onClick={() => navigate("/ai-assistant")}
        >
          Try AI Assistant
        </button>
      </div>
    </div>
  );
}