import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { ToastProvider } from "@elea/ds";
import { Home } from "../screens/Home";
import { NeedView } from "../screens/NeedView";
import { DemoPanel } from "../demo/DemoPanel";
import { useDemo } from "../demo/demo";
import { FlightLayer } from "../blocks/flight/FlightLayer";
import { Shell } from "../shell/Shell";
import { PlaceholderScreen } from "../shell/PlaceholderScreen";
import { DESTINATIONS } from "../shell/destinations";

function TopicPlaceholder() {
  const { topicId } = useParams();
  return (
    <PlaceholderScreen
      title={topicId ? `Sujet « ${topicId} »` : "Sujet"}
      ticketId={25}
      ticketName="Mon entreprise et sujets"
    />
  );
}

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

export function App() {
  const animations = useDemo((s) => s.animations);
  const company = DESTINATIONS.find((d) => d.id === "company")!;
  const plans = DESTINATIONS.find((d) => d.id === "plans")!;
  const search = DESTINATIONS.find((d) => d.id === "search")!;

  return (
    <MotionConfig reducedMotion={animations ? "never" : "always"}>
      <ToastProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route element={<Shell />}>
              <Route path="/" element={<Home />} />
              <Route
                path="/entreprise"
                element={<PlaceholderScreen title={company.label} ticketId={company.ticket!.id} ticketName={company.ticket!.name} />}
              />
              <Route path="/entreprise/:topicId" element={<TopicPlaceholder />} />
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
          <DemoPanel />
          <FlightLayer />
        </BrowserRouter>
      </ToastProvider>
    </MotionConfig>
  );
}
