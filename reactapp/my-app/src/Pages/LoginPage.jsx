import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Button,
  Link,
  Stack,
  Divider,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { FaGoogle, FaFacebook, FaApple } from "react-icons/fa";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
  });

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  // Validation logic
  const validate = (field, value) => {
    let error = "";

    if (field === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) error = "Email is required";
      else if (!emailRegex.test(value)) error = "Enter a valid email address";
    }

    if (field === "password") {
      if (!value.trim()) error = "Password is required";
      else if (value.length < 6)
        error = "Password must be at least 6 characters";
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFormErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // Run validation for all fields before submitting
    const newErrors = {
      email: validate("email", formData.email),
      password: validate("password", formData.password),
    };

    setFormErrors(newErrors);
    setTouched({ email: true, password: true });

    if (Object.values(newErrors).some((err) => err)) return;

    try {
      const response = await fetch("http://127.0.0.1:8001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);

      if (data.role === "Kid") {
        navigate("/dashboard/kids");
      } else if (data.role === "Teen") {
        navigate("/dashboard/teen");
      } else if (data.role === "Adult") {
        navigate("/dashboard/adult");
      } else {
        navigate("/");
      }
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(to bottom right, #EEEEEE, #D4BEE4)",
      }}
    >
      <Card
        elevation={10}
        sx={{
          borderRadius: "24px",
          width: "100%",
          maxWidth: 500,
          transition: "transform 0.3s",
        }}
      >
        <CardContent sx={{ p: 6 }}>
          {/* Header */}
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ fontWeight: "bold", color: "#3B1E54", pb: 2 }}
          >
            Login
          </Typography>

          {/* Form */}
          <Box component="form" noValidate onSubmit={handleLogin}>
            <Stack spacing={3}>
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth
                required
                error={!!formErrors.email}
                helperText={formErrors.email}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "20px",
                  },
                }}
              />

              <TextField
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth
                required
                error={!!formErrors.password}
                helperText={formErrors.password}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "20px",
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {serverError && (
                <Typography sx={{ color: "red", fontSize: 14 }}>
                  {serverError}
                </Typography>
              )}

              <Button
                type="submit"
                fullWidth
                sx={{
                  py: 1.5,
                  fontWeight: "bold",
                  borderRadius: "12px",
                  background: "linear-gradient(to right, #3B1E54, #9B7EBD)",
                  color: "white",
                  boxShadow: 3,
                  "&:hover": {
                    background: "linear-gradient(to right, #9B7EBD, #3B1E54)",
                  },
                }}
              >
                Login
              </Button>
            </Stack>
          </Box>

          {/* Divider */}
          <Divider sx={{ my: 3 }}>or login with</Divider>

          {/* Social Icons */}
          <Stack
            direction="row"
            spacing={3}
            justifyContent="center"
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <IconButton
              sx={{
                color: "#000000",
                bgcolor: "rgba(201, 201, 201, 0.1)",
                "&:hover": { bgcolor: "#D4BEE4" },
              }}
            >
              <FaGoogle size={24} />
            </IconButton>
            <IconButton
              sx={{
                color: "#000000",
                bgcolor: "rgba(201, 201, 201, 0.1)",
                "&:hover": { bgcolor: "#D4BEE4" },
              }}
            >
              <FaFacebook size={24} />
            </IconButton>
            <IconButton
              sx={{
                color: "#000000",
                bgcolor: "rgba(201, 201, 201, 0.1)",
                "&:hover": { bgcolor: "#D4BEE4" },
              }}
            >
              <FaApple size={26} />
            </IconButton>
          </Stack>

          {/* Footer */}
          <Typography
            variant="body2"
            align="center"
            sx={{ color: "text.secondary", mt: 2 }}
          >
            Don’t have an account?{" "}
            <Link
              href="/signup"
              underline="hover"
              sx={{ color: "#3B1E54", fontWeight: 600 }}
            >
              Sign Up
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}