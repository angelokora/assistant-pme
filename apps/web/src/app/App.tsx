import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { ToastProvider } from "@elea/ds";
import { Home } from "../screens/Home";
import { Company } from "../screens/Company";
import { Topic } from "../screens/Topic";
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
import { PlaceholderScreen } from "../shell/PlaceholderScreen";
import { DESTINATIONS } from "../shell/destinations";

function FindingPlaceholder() {
  const { findingId } = useParams();
  return (
    <PlaceholderScreen
      title={findingId ? "Détail d'un finding" : "Finding"}
      ticketId={26}
      ticketName="Détail d'un finding"
    />
  );
}

function PlanPlaceholder() {
  const { planId } = useParams();
  return (
    <PlaceholderScreen
      title={planId ? "Détail du plan" : "Plans"}
      ticketId={27}
      ticketName="Plans et sources"
    />
  );
}

function PrototypeRoutes() {
  useDemoBridge();
  const plans = DESTINATIONS.find((d) => d.id === "plans")!;
  const search = DESTINATIONS.find((d) => d.id === "search")!;

  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Home />} />
        <Route path="/entreprise" element={<Company />} />
        <Route path="/entreprise/:topicId" element={<Topic />} />
        <Route
          path="/plans"
          element={<PlaceholderScreen title={plans.label} ticketId={plans.ticket!.id} ticketName={plans.ticket!.name} />}
        />
        <Route path="/plans/:planId" element={<PlanPlaceholder />} />
        <Route
          path="/recherche"
          element={<PlaceholderScreen title={search.label} ticketId={22} ticketName="Retrouver une information" />}
        />
        <Route path="/finding/:findingId" element={<FindingPlaceholder />} />
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
