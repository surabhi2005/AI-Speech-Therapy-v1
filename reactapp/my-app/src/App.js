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

// Protected Route wrapper
import ProtectedRoute from "./Pages/ProtectedRoute";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected Routes */}
        <Route
          path="/ai-assistant"
          element={
            <ProtectedRoute>
              <AIassistant />
            </ProtectedRoute>
          }
        />
        <Route
          path="/3d-model"
          element={
            <ProtectedRoute>
              <D3DModel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/kids"
          element={
            <ProtectedRoute>
              <KidsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teen"
          element={
            <ProtectedRoute>
              <TeenDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/adult"
          element={
            <ProtectedRoute>
              <AdultDashboard />
            </ProtectedRoute>
          }
        />

        {/* Kids Features */}
        <Route
          path="/kids/storytelling"
          element={
            <ProtectedRoute>
              <Storytelling />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kids/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kids/progress"
          element={
            <ProtectedRoute>
              <Progress />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kids/games"
          element={
            <ProtectedRoute>
              <SpeechGames />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kids/rewards"
          element={
            <ProtectedRoute>
              <KidsReward />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kids/resources"
          element={
            <ProtectedRoute>
              <KidsResources />
            </ProtectedRoute>
          }
        />

        {/* Teen Features */}
        <Route
          path="/teen/storytelling"
          element={
            <ProtectedRoute>
              <TeenStorytelling />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teen/scenario"
          element={
            <ProtectedRoute>
              <DailyScenario />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teen/games"
          element={
            <ProtectedRoute>
              <TeenGames />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teen/progress"
          element={
            <ProtectedRoute>
              <TeenProgress />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teen/resources"
          element={
            <ProtectedRoute>
              <TeenResources />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teen/rewards"
          element={
            <ProtectedRoute>
              <TeenBadges />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teen/profile"
          element={
            <ProtectedRoute>
              <TeenProfile />
            </ProtectedRoute>
          }
        />

        {/* Adult Features */}
        <Route
          path="/adult/filler"
          element={
            <ProtectedRoute>
              <Filler />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adult/stutter"
          element={
            <ProtectedRoute>
              <Stutter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adult/emotion"
          element={
            <ProtectedRoute>
              <EmotionalFeedback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adult/syllable-practice"
          element={
            <ProtectedRoute>
              <Syllable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adult/scenario"
          element={
            <ProtectedRoute>
              <AdultScenario />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adult/progress"
          element={
            <ProtectedRoute>
              <AdultProgress />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adult/resources"
          element={
            <ProtectedRoute>
              <AdultResources />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adult/profile"
          element={
            <ProtectedRoute>
              <AdultProfile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
