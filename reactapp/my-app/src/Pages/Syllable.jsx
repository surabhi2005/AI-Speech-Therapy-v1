// import React, { useState } from "react";
// import { FaMicrophone, FaVolumeUp, FaArrowRight, FaTrophy, FaStar, FaRedo } from "react-icons/fa";
// import AdultSidebar from "./AdultSidebar";

// // Mock dictionary of words → syllable breakdown + similar words
// const wordData = {
//   banana: { syllables: ["ba", "na", "na"], similar: ["band", "ban", "nana"] },
//   computer: { syllables: ["com", "pu", "ter"], similar: ["compute", "commute", "pupil"] },
//   elephant: { syllables: ["el", "e", "phant"], similar: ["elf", "elevate", "phantom"] },
//   tomato: { syllables: ["to", "ma", "to"], similar: ["tom", "mate", "tote"] },
//   butterfly: { syllables: ["but", "ter", "fly"], similar: ["butter", "flutter", "fly"] },
//   pineapple: { syllables: ["pine", "ap", "ple"], similar: ["pine", "apple", "nap"] }
// };

// const Syllable = () => {
//   const words = Object.keys(wordData);
//   const [currentWord, setCurrentWord] = useState(words[Math.floor(Math.random() * words.length)]);
//   const [feedback, setFeedback] = useState(null);
//   const [recording, setRecording] = useState(false);
//   const [score, setScore] = useState(0);
//   const [streak, setStreak] = useState(0);

//   const startPractice = () => {
//     setRecording(true);
//     setFeedback(null);

//     setTimeout(() => {
//       setRecording(false);

//       const syllables = wordData[currentWord].syllables;
//       const syllableResults = syllables.map(() => (Math.random() > 0.7 ? "wrong" : "correct"));
//       const success = syllableResults.every((s) => s === "correct");

//       if (success) {
//         setFeedback({ correct: true, syllableResults });
//         setScore((prev) => prev + 10);
//         setStreak((prev) => prev + 1);
//       } else {
//         setFeedback({
//           correct: false,
//           breakdown: wordData[currentWord].syllables,
//           similar: wordData[currentWord].similar,
//           syllableResults
//         });
//         setStreak(0);
//       }
//     }, 3000);
//   };

//   const nextWord = () => {
//     const newWord = words[Math.floor(Math.random() * words.length)];
//     setCurrentWord(newWord);
//     setFeedback(null);
//   };

//   const tryAgain = () => {
//     setFeedback(null);
//   };

//   const playWord = () => {
//     console.log("Playing word:", currentWord);
//   };

//   return (
//     <div className="min-h-screen" style={{ backgroundColor: "#EEEEEE" }}>
//         <AdultSidebar/>
//       {/* Header */}
//       <div className="w-full max-w-5xl mx-auto mb-6 rounded-2xl p-6 flex justify-between items-center" style={{ backgroundColor: "#3B1E54" }}>
//         <h1 className="text-3xl font-bold text-white">Syllable Safari</h1>
//         <div className="flex gap-4">
//           <div className="bg-white rounded-xl px-4 py-2 flex items-center shadow">
//             <FaTrophy className="text-yellow-500 mr-2" />
//             <span className="font-bold" style={{ color: "#3B1E54" }}>{score} pts</span>
//           </div>
//           <div className="bg-white rounded-xl px-4 py-2 flex items-center shadow">
//             <FaStar className="text-yellow-400 mr-2" />
//             <span className="font-bold" style={{ color: "#3B1E54" }}>{streak} streak</span>
//           </div>
//         </div>
//       </div>

//       {/* Main Layout */}
//       <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
//         {/* Left: Word & Practice */}
//         <div className="bg-white rounded-2xl p-8 shadow-md flex flex-col items-center">
//           <h2 className="text-5xl font-extrabold mb-6" style={{ color: "#3B1E54" }}>{currentWord}</h2>

//           <div className="mb-6 text-center">
//             <span className="text-lg font-semibold block mb-2" style={{ color: "#3B1E54" }}>Syllables:</span>
//             <div className="flex gap-2 justify-center flex-wrap">
//               {wordData[currentWord].syllables.map((syllable, index) => (
//                 <span key={index} className="px-4 py-2 rounded-md text-lg font-bold" style={{ backgroundColor: "#EEEEEE", color: "#3B1E54" }}>
//                   {syllable}
//                 </span>
//               ))}
//             </div>
//           </div>

//           <button 
//             onClick={playWord}
//             className="inline-flex items-center px-5 py-3 rounded-full text-lg font-semibold mb-6"
//             style={{ backgroundColor: "#3B1E54", color: "#EEEEEE" }}
//           >
//             <FaVolumeUp className="mr-2" />
//             Hear Pronunciation
//           </button>

//           <button
//             onClick={startPractice}
//             disabled={recording || feedback}
//             className="px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center w-full"
//             style={{
//               backgroundColor: recording ? "#9B7EBD" : "#3B1E54",
//               color: "#EEEEEE"
//             }}
//           >
//             {recording ? (
//               <>
//                 <div className="w-3 h-3 bg-white rounded-full mr-2 animate-pulse"></div>
//                 Listening...
//               </>
//             ) : feedback ? (
//               "✓ Done!"
//             ) : (
//               <>
//                 <FaMicrophone className="mr-2" />
//                 Try Saying It
//               </>
//             )}
//           </button>
//         </div>

//         {/* Right: Feedback */}
//         <div className="space-y-6">
//           {feedback && feedback.correct && (
//             <div className="bg-white rounded-2xl p-6 shadow-md text-center animate-pulse">
//               <h3 className="text-2xl font-bold mb-4" style={{ color: "#4CAF50" }}>Excellent Pronunciation!</h3>
//               <div className="flex justify-center gap-4 mt-4">
//                 {feedback.syllableResults.map((res, i) => (
//                   <div key={i} className="px-4 py-2 rounded-lg text-xl font-bold" style={{ backgroundColor: "#4CAF50", color: "white" }}>
//                     {wordData[currentWord].syllables[i]}
//                   </div>
//                 ))}
//               </div>
//               <button onClick={nextWord} className="px-5 py-3 mt-6 rounded-full font-semibold shadow-md hover:scale-105 inline-flex items-center" style={{ backgroundColor: "#3B1E54", color: "#EEEEEE" }}>
//                 Next Word <FaArrowRight className="ml-2" />
//               </button>
//             </div>
//           )}

//           {feedback && !feedback.correct && (
//             <>
//               <div className="bg-white rounded-2xl p-6 shadow-md text-center">
//                 <h3 className="text-2xl font-bold mb-4" style={{ color: "#3B1E54" }}>Pronunciation Feedback</h3>
//                 <div className="flex justify-center gap-3 flex-wrap mb-6">
//                   {feedback.breakdown.map((syll, i) => (
//                     <div key={i} className="px-5 py-3 rounded-lg text-xl font-bold" style={{ backgroundColor: feedback.syllableResults[i] === "correct" ? "#4CAF50" : "#F44336", color: "white" }}>
//                       {syll}
//                     </div>
//                   ))}
//                 </div>
//                 <div className="flex gap-4 justify-center">
//                   <button onClick={tryAgain} className="px-5 py-3 rounded-full font-semibold shadow-md hover:scale-105 inline-flex items-center" style={{ backgroundColor: "#9B7EBD", color: "#EEEEEE" }}>
//                     <FaRedo className="mr-2" /> Try Again
//                   </button>
//                   <button onClick={nextWord} className="px-5 py-3 rounded-full font-semibold shadow-md hover:scale-105 inline-flex items-center" style={{ backgroundColor: "#3B1E54", color: "#EEEEEE" }}>
//                     Next Word <FaArrowRight className="ml-2" />
//                   </button>
//                 </div>
//               </div>

//               <div className="bg-white rounded-2xl p-6 shadow-md">
//                 <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: "#3B1E54" }}>Practice These Similar Words</h3>
//                 <div className="flex flex-wrap justify-center gap-3">
//                   {feedback.similar.map((word, i) => (
//                     <div key={i} className="px-4 py-2 rounded-lg text-lg font-semibold shadow" style={{ backgroundColor: "#EEEEEE", color: "#3B1E54" }}>
//                       {word}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Syllable;
import React, { useState } from "react";
import { FaMicrophone, FaVolumeUp, FaArrowRight, FaTrophy, FaStar, FaRedo } from "react-icons/fa";
import AdultSidebar from "./AdultSidebar";

const wordData = {
  banana: { syllables: ["ba", "na", "na"], similar: ["band", "ban", "nana"] },
  computer: { syllables: ["com", "pu", "ter"], similar: ["compute", "commute", "pupil"] },
  elephant: { syllables: ["el", "e", "phant"], similar: ["elf", "elevate", "phantom"] },
  tomato: { syllables: ["to", "ma", "to"], similar: ["tom", "mate", "tote"] },
  butterfly: { syllables: ["but", "ter", "fly"], similar: ["butter", "flutter", "fly"] },
  pineapple: { syllables: ["pine", "ap", "ple"], similar: ["pine", "apple", "nap"] }
};

const Syllable = () => {
  const words = Object.keys(wordData);
  const [currentWord, setCurrentWord] = useState(words[Math.floor(Math.random() * words.length)]);
  const [feedback, setFeedback] = useState(null);
  const [recording, setRecording] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const startPractice = () => {
    setRecording(true);
    setFeedback(null);

    setTimeout(() => {
      setRecording(false);
      const syllables = wordData[currentWord].syllables;
      const results = syllables.map(() => (Math.random() > 0.7 ? "wrong" : "correct"));
      const success = results.every((s) => s === "correct");

      if (success) {
        setFeedback({ correct: true, results });
        setScore((prev) => prev + 10);
        setStreak((prev) => prev + 1);
      } else {
        setFeedback({
          correct: false,
          breakdown: syllables,
          similar: wordData[currentWord].similar,
          results
        });
        setStreak(0);
      }
    }, 3000);
  };

  const nextWord = () => {
    const newWord = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(newWord);
    setFeedback(null);
  };

  const playWord = () => {
    console.log("Playing word:", currentWord);
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#EEEEEE" }}>
      <AdultSidebar />
      <div className="flex-1 p-6 flex flex-col items-center">
        {/* Header */}
        <div className="w-full max-w-5xl mb-6 rounded-2xl p-6 flex justify-between items-center shadow-md"
             style={{ backgroundColor: "#3B1E54" }}>
          <h1 className="text-3xl font-bold text-white">Syllable Safari</h1>
          <div className="flex gap-4">
            <div className="bg-white rounded-xl px-4 py-2 flex items-center shadow">
              <FaTrophy className="text-yellow-500 mr-2" />
              <span className="font-bold" style={{ color: "#3B1E54" }}>{score} pts</span>
            </div>
            <div className="bg-white rounded-xl px-4 py-2 flex items-center shadow">
              <FaStar className="text-yellow-400 mr-2" />
              <span className="font-bold" style={{ color: "#3B1E54" }}>{streak} streak</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Word & Practice */}
          <div className="bg-white rounded-2xl p-8 shadow-md flex flex-col items-center">
            <h2 className="text-5xl font-extrabold mb-6" style={{ color: "#3B1E54" }}>{currentWord}</h2>

            <div className="mb-6 text-center">
              <span className="text-lg font-semibold block mb-2" style={{ color: "#3B1E54" }}>Syllables:</span>
              <div className="flex gap-2 justify-center flex-wrap">
                {wordData[currentWord].syllables.map((s, i) => (
                  <span key={i}
                        className="px-4 py-2 rounded-md text-lg font-bold"
                        style={{ backgroundColor: "#EEEEEE", color: "#3B1E54" }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <button onClick={playWord}
                    className="inline-flex items-center px-5 py-3 rounded-full text-lg font-semibold mb-6"
                    style={{ backgroundColor: "#3B1E54", color: "#EEEEEE" }}>
              <FaVolumeUp className="mr-2" /> Hear Pronunciation
            </button>

            <button onClick={startPractice}
                    disabled={recording || feedback}
                    className="px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center w-full"
                    style={{
                      backgroundColor: recording ? "#9B7EBD" : "#3B1E54",
                      color: "#EEEEEE"
                    }}>
              {recording ? (
                <>
                  <div className="w-3 h-3 bg-white rounded-full mr-2 animate-pulse"></div>
                  Listening...
                </>
              ) : (
                <>
                  <FaMicrophone className="mr-2" /> Try Saying It
                </>
              )}
            </button>
          </div>

          {/* Feedback */}
          <div className="space-y-6">
            {feedback && feedback.correct && (
              <div className="bg-white rounded-2xl p-6 shadow-md text-center">
                <h3 className="text-2xl font-bold mb-4" style={{ color: "#4CAF50" }}>Great Job! 🎉</h3>
                <div className="flex justify-center gap-4 mt-4">
                  {feedback.results.map((res, i) => (
                    <div key={i}
                         className="px-4 py-2 rounded-lg text-xl font-bold"
                         style={{ backgroundColor: "#4CAF50", color: "white" }}>
                      {wordData[currentWord].syllables[i]}
                    </div>
                  ))}
                </div>
                <button onClick={nextWord}
                        className="px-5 py-3 mt-6 rounded-full font-semibold shadow-md hover:scale-105 inline-flex items-center"
                        style={{ backgroundColor: "#3B1E54", color: "#EEEEEE" }}>
                  Next Word <FaArrowRight className="ml-2" />
                </button>
              </div>
            )}

            {feedback && !feedback.correct && (
              <>
                <div className="bg-white rounded-2xl p-6 shadow-md text-center">
                  <h3 className="text-2xl font-bold mb-4" style={{ color: "#3B1E54" }}>Keep Practicing!</h3>
                  <div className="flex justify-center gap-3 flex-wrap mb-6">
                    {feedback.breakdown.map((syll, i) => (
                      <div key={i}
                           className="px-5 py-3 rounded-lg text-xl font-bold"
                           style={{
                             backgroundColor: feedback.results[i] === "correct" ? "#4CAF50" : "#F44336",
                             color: "white"
                           }}>
                        {syll}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 justify-center">
                    <button onClick={() => setFeedback(null)}
                            className="px-5 py-3 rounded-full font-semibold shadow-md hover:scale-105 inline-flex items-center"
                            style={{ backgroundColor: "#9B7EBD", color: "#EEEEEE" }}>
                      <FaRedo className="mr-2" /> Try Again
                    </button>
                    <button onClick={nextWord}
                            className="px-5 py-3 rounded-full font-semibold shadow-md hover:scale-105 inline-flex items-center"
                            style={{ backgroundColor: "#3B1E54", color: "#EEEEEE" }}>
                      Next Word <FaArrowRight className="ml-2" />
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-md">
                  <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: "#3B1E54" }}>Try These Similar Words</h3>
                  <div className="flex flex-wrap justify-center gap-3">
                    {feedback.similar.map((word, i) => (
                      <div key={i}
                           className="px-4 py-2 rounded-lg text-lg font-semibold shadow"
                           style={{ backgroundColor: "#EEEEEE", color: "#3B1E54" }}>
                        {word}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Syllable;
