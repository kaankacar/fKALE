import { Button, Icon, Layout } from "@stellar/design-system";
import "./App.module.css";
import "./styles/theme.css";
import ConnectAccount from "./components/ConnectAccount.tsx";
import ThemeToggle from "./components/ThemeToggle.tsx";
import { Routes, Route, Outlet, NavLink } from "react-router-dom";
import { ThemeProvider } from "./providers/ThemeProvider.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import Home from "./pages/Home";
import Debugger from "./pages/Debugger.tsx";
import BuyFKale from "./pages/BuyFKale";
import RedeemKale from "./pages/RedeemKale";
import ManagePosition from "./pages/ManagePosition";

const AppLayout: React.FC = () => (
  <main style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
    <Layout.Header
      projectId="fKALE"
      projectTitle="fKALE"
      contentRight={
        <>
          <nav style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <NavLink to="/buy-fkale" style={{ textDecoration: "none" }}>
              {({ isActive }) => (
                <Button 
                  variant="tertiary" 
                  size="md" 
                  disabled={isActive}
                  style={{
                    background: isActive ? 'var(--brand-primary)' : 'var(--bg-glass)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '12px',
                    color: isActive ? 'white' : 'var(--text-primary)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  💰 Buy fKALE
                </Button>
              )}
            </NavLink>
            <NavLink to="/redeem-kale" style={{ textDecoration: "none" }}>
              {({ isActive }) => (
                <Button 
                  variant="tertiary" 
                  size="md" 
                  disabled={isActive}
                  style={{
                    background: isActive ? 'var(--brand-primary)' : 'var(--bg-glass)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '12px',
                    color: isActive ? 'white' : 'var(--text-primary)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  🌾 Redeem
                </Button>
              )}
            </NavLink>
            <NavLink to="/manage-position" style={{ textDecoration: "none" }}>
              {({ isActive }) => (
                <Button 
                  variant="tertiary" 
                  size="md" 
                  disabled={isActive}
                  style={{
                    background: isActive ? 'var(--brand-primary)' : 'var(--bg-glass)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '12px',
                    color: isActive ? 'white' : 'var(--text-primary)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  ⚙️ Position
                </Button>
              )}
            </NavLink>
            <NavLink to="/debug" style={{ textDecoration: "none" }}>
              {({ isActive }) => (
                <Button 
                  variant="tertiary" 
                  size="md" 
                  disabled={isActive}
                  style={{
                    background: isActive ? 'var(--brand-primary)' : 'var(--bg-glass)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '12px',
                    color: isActive ? 'white' : 'var(--text-primary)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Icon.Code02 size="md" />
                </Button>
              )}
            </NavLink>
          </nav>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ThemeToggle />
            <ConnectAccount />
          </div>
        </>
      }
    />
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
    <div style={{
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-light)',
      color: 'var(--text-secondary)',
      padding: '1rem',
      textAlign: 'center'
    }}>
      <span>
        © {new Date().getFullYear()} fKALE - "Trade your unfarmed $KALE". Licensed under the{" "}
        <a
          href="http://www.apache.org/licenses/LICENSE-2.0"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--brand-primary)', textDecoration: 'none' }}
        >
          Apache License, Version 2.0
        </a>
        .
      </span>
    </div>
  </main>
);

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/buy-fkale" element={<BuyFKale />} />
          <Route path="/redeem-kale" element={<RedeemKale />} />
          <Route path="/manage-position" element={<ManagePosition />} />
          <Route path="/debug" element={<Debugger />} />
          <Route path="/debug/:contractName" element={<Debugger />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
