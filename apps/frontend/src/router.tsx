import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import { Layout } from "./components/Layout.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { LoginPage } from "./features/auth/LoginPage.tsx";
import { RegisterPage } from "./features/auth/RegisterPage.tsx";
import { DashboardPage } from "./features/dashboard/DashboardPage.tsx";
import { ModuleListPage } from "./features/learning/ModuleListPage.tsx";
import { LessonListPage } from "./features/learning/LessonListPage.tsx";
import { LessonPage } from "./features/learning/LessonPage.tsx";
import { QuizPage } from "./features/learning/QuizPage.tsx";
import { ToolIndexPage } from "./features/learning/tools/ToolIndexPage.tsx";
import { ChannelExplorerPage } from "./features/learning/tools/ChannelExplorerPage.tsx";
import { MmsiDecoderPage } from "./features/learning/tools/MmsiDecoderPage.tsx";
import { DscBuilderPage } from "./features/learning/tools/DscBuilderPage.tsx";
import { ScriptBuilderPage } from "./features/learning/tools/ScriptBuilderPage.tsx";
import { ProgressPage } from "./features/progress/ProgressPage.tsx";
import { SimulatorPage } from "./features/simulator/SimulatorPage.tsx";
import { DrillPage } from "./features/simulator/drills/DrillPage.tsx";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn"
            element={
              <ProtectedRoute>
                <ModuleListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/:moduleId"
            element={
              <ProtectedRoute>
                <LessonListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/:moduleId/:lessonId"
            element={
              <ProtectedRoute>
                <LessonPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/:moduleId/quiz"
            element={
              <ProtectedRoute>
                <QuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools"
            element={
              <ProtectedRoute>
                <ToolIndexPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/channel-explorer"
            element={
              <ProtectedRoute>
                <ChannelExplorerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/mmsi-decoder"
            element={
              <ProtectedRoute>
                <MmsiDecoderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/dsc-builder"
            element={
              <ProtectedRoute>
                <DscBuilderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/script-builder"
            element={
              <ProtectedRoute>
                <ScriptBuilderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sim"
            element={
              <ProtectedRoute>
                <SimulatorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drill"
            element={
              <ProtectedRoute>
                <DrillPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <ProgressPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
