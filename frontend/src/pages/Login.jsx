import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import loginImage from "../assets/login-illustration.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { clearAuthSession, setAuthSession } from "../utils/authStorage";
import "./Login.css";
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email: normalizedEmail,
        password,
      });

      clearAuthSession();
      setAuthSession(res.data.token, res.data.role);

      if (res.data.role === "student") {
        navigate("/student");
      } 
      else if (res.data.role === "staff") {
        navigate("/staff");
      }
      else if(res.data.role ==="admin"){
        navigate("/admin");
      }


    } 
    catch (error) {
      const message = error?.response?.data?.message || "Invalid credentials";
      alert(message);
    }
  };

 return (
  <div className="login-wrapper">
    <div className="login-container">

      {/* LEFT SIDE */}
      <div className="login-left">
        <img
          src={loginImage}
          alt="Login Illustration"
          className="login-image"
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="login-right">
        <h1 className="project-title">Student Performance Normalizer</h1>

        <h2 className="login-heading">LOGIN</h2>
        <p className="login-subtitle">
          Welcome! Please enter your information
        </p>

        <form onSubmit={handleLogin}>
      <div className="form-group floating">
        <input
          type="email"
          value={email}
        onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label>Email Address</label>
      </div>


          <div className="form-group floating password-group">
  <input
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
  />
  <label>Password</label>

  <span
    className="toggle-password"
    onClick={() => setShowPassword(!showPassword)}
  >
    {showPassword ? <FaEyeSlash /> : <FaEye />}
  </span>
</div>


          <div className="forgot-password">
            <span>Forgot password?</span>
          </div>

          <button type="submit" className="login-button">
            Login
          </button>

          <p className="login-note">
            Students must use @avp.ac.in, staff must use @avp.bitsathy.ac.in
          </p>
        </form>
      </div>

    </div>
  </div>
);

}

export default Login;
