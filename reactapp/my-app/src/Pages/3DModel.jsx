// import React, { useState, useRef } from "react";
// import { Canvas, useFrame } from "@react-three/fiber";
// import { OrbitControls, useGLTF } from "@react-three/drei";
// import * as THREE from "three";
// import lisaViseme from "./model/lisavime1.glb";

// function VisemeHead({ currentViseme }) {
//   const { scene, nodes, materials } = useGLTF(lisaViseme);
//   const headMesh = nodes.Head001;
//   const groupRef = useRef();

//   if (materials?.["Skin.001"]) {
//     const skinMat = materials["Skin.001"];
//     skinMat.color.set(new THREE.Color(0xffebd5));
//     skinMat.metalness = 0.05;
//     skinMat.roughness = 0.35;
//     skinMat.emissive.set(new THREE.Color(0xfff2e0));
//     skinMat.emissiveIntensity = 0.08;
//   }

//   if (materials?.Lips) {
//     materials.Lips.color.set(new THREE.Color(0x9a3f3f)); // Primary theme
//     materials.Lips.roughness = 0.25;
//     materials.Lips.metalness = 0.05;
//   }

//   if (materials?.Eyes) {
//     materials.Eyes.color.set(new THREE.Color(0xffffff));
//     materials.Eyes.roughness = 0.1;
//     materials.Eyes.metalness = 0.3;
//   }

//   useFrame(() => {
//     if (groupRef.current) {
//       groupRef.current.rotation.y = THREE.MathUtils.degToRad(0);
//       groupRef.current.rotation.z = THREE.MathUtils.degToRad(1);
//     }

//     if (!headMesh?.morphTargetInfluences || !headMesh.morphTargetDictionary) return;

//     headMesh.morphTargetInfluences.fill(0);
//     const dict = headMesh.morphTargetDictionary;
//     const setInfluence = (name, value) => {
//       if (dict[name] !== undefined) headMesh.morphTargetInfluences[dict[name]] = value;
//     };

//     const visemeMap = {
//       A: ["AA", "Aletter"], B: ["pp", "LipsUpperClose"], C: ["kk", "CH"], D: ["dd"],
//       E: ["EE"], F: ["ff"], G: ["kk"], H: ["JawOpen"], I: ["IH"], J: ["CH"],
//       K: ["kk"], L: ["dd"], M: ["pp"], N: ["nn"], O: ["OH"], P: ["pp"],
//       Q: ["kk", "OU"], R: ["rr"], S: ["ss"], T: ["dd", "TH"], U: ["OU"],
//       V: ["ff", "LipsFunnel"], W: ["OU"], X: ["kk", "ss"], Y: ["IH", "EE"], Z: ["ss"]
//     };

//     if (currentViseme && visemeMap[currentViseme]) {
//       visemeMap[currentViseme].forEach(v => setInfluence(v, 1));
//     }
//   });

//   return <primitive ref={groupRef} object={scene} scale={3} position={[0, 0, 0]} />;
// }

// export default function D3DModel() {
//   const [currentViseme, setCurrentViseme] = useState(null);
//   const [viewMode, setViewMode] = useState("ALL");
//   const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
//   const vowels = ["A", "E", "I", "O", "U"];
//   const consonants = alphabets.filter(l => !vowels.includes(l));
//   const displayedLetters =
//     viewMode === "VOWELS" ? vowels : viewMode === "CONSONANTS" ? consonants : alphabets;

//   const speak = (text) => {
//     const utterance = new SpeechSynthesisUtterance(text);
//     utterance.lang = "en-US";

//     utterance.onboundary = (event) => {
//       const char = text[event.charIndex]?.toUpperCase();
//       if (char) setCurrentViseme(char);
//     };
//     utterance.onend = () => setCurrentViseme(null);

//     speechSynthesis.cancel();
//     speechSynthesis.speak(utterance);
//   };

//   return (
//     <div
//       style={{
//         width: "100vw",
//         height: "100vh",
//         background: "linear-gradient(135deg, #EEEEEE 0%, #D4BEE4 100%)",
//         position: "relative",
//         overflow: "hidden",
//         fontFamily: "Inter, sans-serif",
//       }}
//     >
//       <Canvas camera={{ position: [0, 0, 4] }}>
//         <ambientLight intensity={1.2} />
//         <directionalLight position={[2, 4, 3]} intensity={1.5} />
//         <pointLight position={[0, 2, 2]} intensity={1.2} />
//         <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
//         <VisemeHead currentViseme={currentViseme} />
//       </Canvas>

//       {/* Alphabet Controls */}
//       <div
//         style={{
//           position: "absolute",
//           bottom: 30,
//           left: "50%",
//           transform: "translateX(-50%)",
//           display: "flex",
//           flexWrap: "wrap",
//           gap: "10px",
//           maxWidth: "85%",
//           justifyContent: "center",
//         }}
//       >
//         {displayedLetters.map((l) => (
//           <button
//             key={l}
//             onClick={() => speak(l)}
//             style={{
//               fontSize: "1.5rem",
//               padding: "12px 16px",
//               borderRadius: "12px",
//               border: "none",
//               background: "#3B1E54",
//               color: "#EEEEEE",
//               fontWeight: "600",
//               cursor: "pointer",
//               boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
//               transition: "all 0.2s ease",
//             }}
//             onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
//             onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
//           >
//             {l}
//           </button>
//         ))}
//       </div>

//       {/* View Mode Selector */}
//       <div
//         style={{
//           position: "absolute",
//           top: 20,
//           left: "50%",
//           transform: "translateX(-50%)",
//           display: "flex",
//           gap: "12px",
//         }}
//       >
//         {["ALL", "VOWELS", "CONSONANTS"].map((mode) => (
//           <button
//             key={mode}
//             onClick={() => setViewMode(mode)}
//             style={{
//               padding: "8px 14px",
//               borderRadius: "8px",
//               border: "1px solid #9B7EBD",
//               background: viewMode === mode ? "#9B7EBD" : "#EEEEEE",
//               color: viewMode === mode ? "#EEEEEE" : "#3B1E54",
//               fontWeight: "600",
//               cursor: "pointer",
//               transition: "all 0.2s ease",
//               boxShadow: viewMode === mode ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
//             }}
//           >
//             {mode}
//           </button>
//         ))}
//       </div>

//       {/* AI Assistant Button */}
//       <button
//         style={{
//           position: "absolute",
//           bottom: 20,
//           right: 20,
//           padding: "14px 24px",
//           borderRadius: "50px",
//           background: "#9B7EBD",
//           color: "#EEEEEE",
//           border: "none",
//           fontSize: "1rem",
//           fontWeight: "600",
//           cursor: "pointer",
//           boxShadow: "0px 6px 18px rgba(0,0,0,0.2)",
//           transition: "all 0.2s ease",
//         }}
//         onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
//         onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
//         onClick={() => alert("Launching AI Assistant...")}
//       >
//         Try AI Assistant
//       </button>
//     </div>
//   );
// }


import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import KidsSidebar from "./KidsSidebar"; // Make sure the path is correct
import lisaViseme from "./model/lisavime1.glb";

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

  return <primitive ref={groupRef} object={scene} scale={3} position={[0, 0, 0]} />;
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
      {/* Kids Sidebar */}
      <KidsSidebar />

      {/* Main Content */}
      <div style={{ flex: 1, position: "relative", background: "linear-gradient(135deg, #EEEEEE 0%, #D4BEE4 100%)" }}>
        <Canvas camera={{ position: [0, 0, 4] }}>
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
