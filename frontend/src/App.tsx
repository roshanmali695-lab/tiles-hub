import { Routes, Route } from "react-router-dom";
import AppShell from "@/components/AppShell";
import DesignStudio from "@/pages/DesignStudio";
import Designs from "@/pages/Designs";
import Home from "@/pages/Home";
import Profile from "@/pages/Profile";
import Showroom from "@/pages/Showroom";
import Tiles from "@/pages/Tiles";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/ai-design" element={<DesignStudio />} />
        <Route path="/my-tiles" element={<Tiles />} />
        <Route path="/my-designs" element={<Designs />} />
        <Route path="/showroom" element={<Showroom />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
