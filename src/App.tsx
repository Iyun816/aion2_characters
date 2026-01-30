import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AdminProvider } from './contexts/AdminContext';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminLoginModal from './components/AdminLoginModal';

// 懒加载页面组件
const CharacterBDPage = lazy(() => import('./pages/CharacterBDPage'));
const ToolsPage = lazy(() => import('./pages/ToolsPage'));
const ItemsPage = lazy(() => import('./pages/ItemsPage'));
const JoinLegionPage = lazy(() => import('./pages/JoinLegionPage'));
const LegionPage = lazy(() => import('./pages/LegionPage'));
const MemberDetailPage = lazy(() => import('./pages/MemberDetailPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

// 页面加载占位组件
function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '50vh',
      color: '#a0a0a0'
    }}>
      加载中...
    </div>
  );
}

function AppRoutes() {
  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<CharacterBDPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/join-legion" element={<JoinLegionPage />} />
            <Route path="/legion" element={<LegionPage />} />
            <Route path="/member/:id" element={<MemberDetailPage />} />
            <Route path="/character/:serverId/:characterId" element={<MemberDetailPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <AdminLoginModal />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AdminProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AdminProvider>
    </ErrorBoundary>
  );
}

export default App;
