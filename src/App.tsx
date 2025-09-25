import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CommentProvider } from "./contexts/CommentContext";
import { LoginModalProvider } from "./contexts/LoginModalContext";
import { LoginModal } from "./components/LoginModal";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";


import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import RecuperarSenha from "./pages/RecuperarSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import Cadastro from "./pages/Cadastro";
import Perfil from "./pages/Perfil";
import Membros from "./pages/Membros";
import BeautyWall from "./pages/BeautyWall";
import Planos from "./pages/Planos";
import AgendaProfissional from "./pages/AgendaProfissional";
import AgendaPessoal from "./pages/AgendaPessoal";
import NovoAgendamento from "./pages/NovoAgendamento";
import RelatoriosAgenda from "./pages/RelatoriosAgenda";
import ConfiguracoesAgenda from "./pages/ConfiguracoesAgenda";
import AgendaCompleta from "./pages/AgendaCompleta";
import CriarSalon from "./pages/CriarSalon";
import SalonProfile from "./pages/SalonProfile";
import AreaAdministrativa from "./pages/AreaAdministrativa";
import AdminWhatsApp from "./pages/AdminWhatsApp";
import { SuperAdminRoute } from "./components/SuperAdminRoute";

const queryClient = new QueryClient();

const App = () => {
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CommentProvider>
          <LoginModalProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <LoginModal />
                <PWAInstallPrompt />
                {/* <SalonDebug /> */}
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/perfil" element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            } />
            <Route path="/perfil/:userId" element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            } />
            <Route path="/membros" element={<Membros />} />
            <Route path="/beautywall" element={<BeautyWall />} />
            <Route path="/planos" element={<Planos />} />
            <Route path="/agenda-profissional" element={
              <ProtectedRoute>
                <AgendaProfissional />
              </ProtectedRoute>
            } />
            <Route path="/agenda-pessoal" element={
              <ProtectedRoute>
                <AgendaPessoal />
              </ProtectedRoute>
            } />
            <Route path="/area-administrativa" element={
              <ProtectedRoute>
                <AreaAdministrativa />
              </ProtectedRoute>
            } />
            <Route path="/admin/whatsapp-campaigns" element={
              <ProtectedRoute>
                <SuperAdminRoute>
                  <AdminWhatsApp />
                </SuperAdminRoute>
              </ProtectedRoute>
            } />
            <Route path="/novo-agendamento" element={
              <ProtectedRoute>
                <NovoAgendamento />
              </ProtectedRoute>
            } />
            <Route path="/relatorios-agenda" element={
              <ProtectedRoute>
                <RelatoriosAgenda />
              </ProtectedRoute>
            } />
            <Route path="/configuracoes-agenda" element={
              <ProtectedRoute>
                <ConfiguracoesAgenda />
              </ProtectedRoute>
            } />
            <Route path="/agenda-completa" element={
              <ProtectedRoute>
                <AgendaCompleta />
              </ProtectedRoute>
            } />
            <Route path="/criar-salao" element={
              <ProtectedRoute>
                <CriarSalon />
              </ProtectedRoute>
            } />
            <Route path="/salon/:id" element={<SalonProfile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
                      </Routes>
              </BrowserRouter>
              {/* <PerformanceDebug isVisible={debugVisible} /> */}
            </TooltipProvider>
          </LoginModalProvider>
        </CommentProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
