import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { ToastProvider } from "@elea/ds";
import { Home } from "../screens/Home";
import { Company } from "../screens/Company";
import { Topic } from "../screens/Topic";
import { DimensionPage } from "../screens/DimensionPage";
import { FindingPage } from "../screens/FindingPage";
import { Plans } from "../screens/Plans";
import { PlanDetail } from "../screens/PlanDetail";
import { NeedView } from "../screens/NeedView";
import { DemoPanel } from "../demo/DemoPanel";
import { DeviceStage } from "../demo/DeviceStage";
import { useDemo } from "../demo/demo";
import { clearLegacyFrameKeys, isFrameMode } from "../demo/bridge";
import { useDemoBridge } from "../demo/useDemoBridge";
import { useMediaQuery } from "../composer/useMediaQuery";

clearLegacyFrameKeys();

import { FlightLayer } from "../blocks/flight/FlightLayer";
import { Shell } from "../shell/Shell";
import { Search } from "../screens/Search";

function PrototypeRoutes() {
  useDemoBridge();

  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Home />} />
        <Route path="/entreprise" element={<Company />} />
        <Route path="/entreprise/dimension/:dimensionId" element={<DimensionPage />} />
        <Route path="/entreprise/:subjectId" element={<Topic />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/plans/:planId" element={<PlanDetail />} />
        <Route path="/recherche" element={<Search />} />
        <Route path="/finding/:findingId" element={<FindingPage />} />
        <Route path="/besoin/:scenarioId" element={<NeedView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  const animations = useDemo((s) => s.animations);
  const device = useDemo((s) => s.device);
  const setDevice = useDemo((s) => s.setDevice);
  const desktop = useMediaQuery("(min-width: 1024px)");
  const framed = isFrameMode();

  useEffect(() => {
    if (!framed && !desktop && device !== "desktop") setDevice("desktop");
  }, [framed, desktop, device, setDevice]);

  useEffect(() => {
    document.documentElement.dataset.animations = animations ? "on" : "off";
  }, [animations]);

  const deviceHost = !framed && desktop && device !== "desktop";

  return (
    <MotionConfig reducedMotion={animations ? "never" : "always"}>
      <ToastProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          {deviceHost ? (
            <>
              <DeviceStage />
              <DemoPanel host />
            </>
          ) : (
            <>
              <PrototypeRoutes />
              {!framed && <DemoPanel />}
              <FlightLayer />
            </>
          )}
        </BrowserRouter>
      </ToastProvider>
    </MotionConfig>
  );
}
