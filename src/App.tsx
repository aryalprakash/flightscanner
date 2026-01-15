import { Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";

import { Home } from "@/pages/Home";
import { Search } from "@/pages/Search";
import { NotFound } from "@/pages/NotFound";

function App() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Box>
  );
}

export default App;
