import { useNavigate } from "react-router-dom";
import { Box, Container, Typography, Button } from "@mui/material";
import { Home as HomeIcon, SentimentDissatisfied } from "@mui/icons-material";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: "center" }}>
          <SentimentDissatisfied
            sx={{ fontSize: 80, color: "text.secondary", mb: 2 }}
          />
          <Typography variant="h2" component="h1" gutterBottom>
            404
          </Typography>
          <Typography variant="h4" color="text.secondary" gutterBottom>
            Page Not Found
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            The page you're looking for doesn't exist or has been moved.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

export default NotFound;
