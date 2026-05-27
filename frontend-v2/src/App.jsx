import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import EventDetailPage from "./pages/EventDetailPage";
import EventRegisterPage from "./pages/EventRegisterPage";
import EventCreatePage from "./pages/EventCreatePage";
import EventRegistrationsPage from "./pages/EventRegistrationsPage";
import ProfilePage from "./pages/ProfilePage";
import OtherProfilePage from "./pages/OtherProfilePage";
import PostCreatePage from "./pages/PostCreatePage";
import PostDetailPage from "./pages/PostDetailPage";
import PostEditPage from "./pages/PostEditPage";
import RegistrationRecordPage from "./pages/RegistrationRecordPage";
import BoardPage from "./pages/BoardPage";
import BoardPostDetailPage from "./pages/BoardPostDetailPage";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/events/:id/register" element={<EventRegisterPage />} />
        <Route path="/events/create" element={<ProtectedRoute><EventCreatePage /></ProtectedRoute>} />
        <Route path="/events/:id/edit" element={<ProtectedRoute><EventCreatePage /></ProtectedRoute>} />
        <Route path="/events/:id/registrations" element={<ProtectedRoute><EventRegistrationsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/profile/:userId" element={<OtherProfilePage />} />
        <Route path="/posts/create" element={<ProtectedRoute><PostCreatePage /></ProtectedRoute>} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/posts/:id/edit" element={<ProtectedRoute><PostEditPage /></ProtectedRoute>} />
        <Route path="/my-registrations" element={<ProtectedRoute><RegistrationRecordPage /></ProtectedRoute>} />
        <Route path="/board" element={<BoardPage />} />
        <Route path="/board/posts/:id" element={<BoardPostDetailPage />} />
      </Routes>
    </>
  );
}

export default App;
