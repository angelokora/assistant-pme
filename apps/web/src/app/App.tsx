import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { Home } from "../screens/Home";
import { NeedView } from "../screens/NeedView";
import { DemoPanel } from "../demo/DemoPanel";
import { useDemo } from "../demo/demo";
import { FlightLayer } from "../blocks/flight/FlightLayer";

export function App() {
  const animations = useDemo((s) => s.animations);
  return (
    // Les animations restent actives même si le système demande de les réduire (décision produit).
    <MotionConfig reducedMotion={animations ? "never" : "always"}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/besoin/:scenarioId" element={<NeedView />} />
        </Routes>
        <DemoPanel />
        <FlightLayer />
      </BrowserRouter>
    </MotionConfig>
  );
}
