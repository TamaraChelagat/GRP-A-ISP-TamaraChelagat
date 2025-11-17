import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)",
      }}
    >
      <Typography variant="h2" fontWeight={700} color="#2d3a4a" gutterBottom>
        FraudDetectPro
      </Typography>
      <Typography variant="h5" color="#4f5b62" mb={4}>
        AI-powered Credit Card Fraud Detection & Dashboard
      </Typography>
      <Button
        variant="contained"
        color="primary"
        size="large"
        sx={{ borderRadius: 3, px: 5, py: 1.5, fontWeight: 600, fontSize: "1.2rem" }}
        onClick={() => navigate("/signin")}
      >
        Get Started
      </Button>
    </Box>
  );
};

export default LandingPage;
