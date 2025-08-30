import React, { useState } from "react";
import axios from "axios";
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

export default function SignupPage() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Validation rules
  const validate = (field, value) => {
    let error = "";

    if (field === "full_name") {
      if (!value.trim()) error = "Full name is required";
      else if (value.trim().length < 3)
        error = "Full name must be at least 3 characters";
    }

    if (field === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) error = "Enter a valid email address";
    }

    if (field === "password") {
      const passwordRegex =
        /^(?=.[a-z])(?=.[A-Z])(?=.\d)(?=.[@$!%?&])[A-Za-z\d@$!%?&]{8,}$/;
      if (!passwordRegex.test(value))
        error =
          "Password must be at least 8 chars, include uppercase, lowercase, number & special character";
    }

    if (field === "confirmPassword") {
      if (value !== formData.password) error = "Passwords do not match";
    }

    if (field === "age") {
      if (!value || parseInt(value, 10) <= 0) error = "Enter a valid age";
    }

    return error;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });

    const error = validate(name, value);
    setErrors({ ...errors, [name]: error });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // validate all fields
    let newErrors = {};
    Object.keys(formData).forEach((field) => {
      const error = validate(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({
        full_name: true,
        email: true,
        password: true,
        confirmPassword: true,
        age: true,
      });
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/auth/signup", {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        age: parseInt(formData.age, 10),
      });

      setMessage("Signup successful! Please login.");
      console.log(response.data);
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.detail || "Signup failed");
      } else {
        setMessage("Network error");
      }
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
            component="h2"
            align="center"
            gutterBottom
            sx={{ fontWeight: "bold", color: "#3B1E54", pb: 1 }}
          >
            Create Your Account
          </Typography>

          {/* Form */}
          <Box
            component="form"
            noValidate
            autoComplete="off"
            onSubmit={handleSubmit}
          >
            <Stack spacing={3}>
              <TextField
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth
                required
                error={touched.full_name && Boolean(errors.full_name)}
                helperText={touched.full_name && errors.full_name}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "20px" },
                }}
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth
                required
                error={touched.email && Boolean(errors.email)}
                helperText={touched.email && errors.email}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "20px" },
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
                error={touched.password && Boolean(errors.password)}
                helperText={touched.password && errors.password}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "20px" },
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
              <TextField
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth
                required
                error={
                  touched.confirmPassword && Boolean(errors.confirmPassword)
                }
                helperText={touched.confirmPassword && errors.confirmPassword}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "20px" },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirm(!showConfirm)}
                        edge="end"
                      >
                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Age"
                name="age"
                type="number"
                inputProps={{ min: 0 }}
                value={formData.age}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth
                required
                error={touched.age && Boolean(errors.age)}
                helperText={touched.age && errors.age}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "20px" },
                }}
              />
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
                Sign Up
              </Button>
            </Stack>
          </Box>

          {/* Divider */}
          <Divider sx={{ my: 2 }}>or sign up with</Divider>

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
            Already have an account?{" "}
            <Link
              href="/login"
              underline="hover"
              sx={{ color: "#3B1E54", fontWeight: 600 }}
            >
              Login
            </Link>
          </Typography>

          {/* Message */}
          {message && (
            <Typography
              align="center"
              sx={{ mt: 2, color: "red", fontWeight: 500 }}
            >
              {message}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}