import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Main pages
import D3DModel from "./Pages/3DModel";
import MainPage from "./Pages/MainPage";
import LoginPage from "./Pages/LoginPage";
import SignupPage from "./Pages/SignupPage";

// Dashboards
import KidsDashboard from "./Pages/KidsDashboard";
import TeenDashboard from "./Pages/TeenDashboard";
import AdultDashboard from "./Pages/AdultDashboard";

// Features
import Storytelling from "./Pages/StoryTelling";

// Common Pages
import Profile from "./Pages/Profile";
import Progress from "./Pages/Progress";
import AIassistant from "./Pages/AIassistant";
import SpeechGames from "./Pages/SpeechGames";
import Filler from "./Pages/Filler";
import Stutter from "./Pages/Stutter";
import EmotionalFeedback from "./Pages/EmotionalFeedback";
import TeenStorytelling from "./Pages/TeenStoryTelling";
import Syllable from "./Pages/Syllable";
import DailyScenario from "./Pages/TeenDailyScenario";
import AdultScenario from "./Pages/AdultDailyScenario";
import KidsReward from "./Pages/KidsReward";
import AdultProgress from "./Pages/AdultProgress";
import TeenGames from "./Pages/TeenGames";
import TeenProgress from "./Pages/TeenProgress";
import KidsResources from "./Pages/KidsResources";
import TeenResources from "./Pages/TeenResources";
import AdultResources from "./Pages/AdultResources";
import AdultProfile from "./Pages/AdultProfile";
import TeenBadges from "./Pages/TeenRewards";
import TeenProfile from "./Pages/TeenProfile";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/ai-assistant" element={<AIassistant/>}/>
        <Route path="/3d-model" element={<D3DModel />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard/kids" element={<KidsDashboard />} />
        <Route path="/dashboard/teen" element={<TeenDashboard />} />
        <Route path="/dashboard/adult" element={<AdultDashboard />} />
        <Route path="/kids/storytelling" element={<Storytelling />} />
        <Route path="/kids/profile" element={<Profile />} />
        <Route path="/kids/progress" element={<Progress />} />
        <Route path="/kids/games" element={<SpeechGames/>}/>
        <Route path="/adult/filler" element={<Filler/>}/>
        <Route path="/adult/stutter" element={<Stutter/>}/>
        <Route path="/adult/emotion" element={<EmotionalFeedback/>}/>
        <Route path="/teen/storytelling" element={<TeenStorytelling/>}/>
        <Route path="/adult/syllable-practice" element={<Syllable/>}/>
        <Route path="/teen/scenario" element={<DailyScenario/>}/>
        <Route path="/adult/scenario" element={<AdultScenario/>}/>
        <Route path="/kids/rewards" element={<KidsReward/>}/>
        <Route path="/adult/progress" element={<AdultProgress/>}/>
        <Route path="/teen/games" element={<TeenGames/>}/>
        <Route path="/teen/progress" element={<TeenProgress/>}/>
        <Route path="/kids/resources" element={<KidsResources/>}/>
        <Route path="/teen/resources" element={<TeenResources/>}/>
         <Route path="/adult/resources" element={<AdultResources/>}/>
         <Route path="/adult/profile" element={<AdultProfile/>}/>
         <Route path="/teen/rewards" element={<TeenBadges/>}/>
         <Route path="/teen/profile" element={<TeenProfile/>}/>
      </Routes>
    </Router>
  );
}
