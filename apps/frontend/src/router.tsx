import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import { Layout } from "./components/Layout.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { LoginPage } from "./features/auth/LoginPage.tsx";
import { RegisterPage } from "./features/auth/RegisterPage.tsx";
import { ModuleListPage } from "./features/learning/ModuleListPage.tsx";
import { LessonListPage } from "./features/learning/LessonListPage.tsx";
import { LessonPage } from "./features/learning/LessonPage.tsx";
import { QuizPage } from "./features/learning/QuizPage.tsx";
import { ProgressPage } from "./features/progress/ProgressPage.tsx";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
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
            path="/progress"
            element={
              <ProtectedRoute>
                <ProgressPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/learn" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
