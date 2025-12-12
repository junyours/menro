import { useEffect, useState, useRef } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { Modal, Spin, Button, Progress } from "antd";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiXCircle,
  FiLock as FiLockIcon,
} from "react-icons/fi";

import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import Checkbox from "@/Components/Checkbox";
import Header from "@/Components/Header";
import Footer from "@/Components/Footer";

export default function Login({ status, canResetPassword }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: "",
    password: "",
    remember: false,
  });

  const [customErrors, setCustomErrors] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [modalState, setModalState] = useState({
    open: false,
    type: "loading", // "loading" | "success" | "error" | "suggestReset"
  });
  const [attempts, setAttempts] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef(null);

  // Load saved email
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setData("email", savedEmail);
      setData("remember", true);
    }
    return () => reset("password");
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(countdownRef.current);
  }, [countdown]);

  const validateField = (field, value) => {
    let newErrors = { ...customErrors };
    if (field === "email") {
      newErrors.email = value.endsWith("@gmail.com") ? "" : "Email must end with @gmail.com";
    }
    if (field === "password") {
      newErrors.password =
        value.length >= 6 ? "" : "Password must be at least 6 characters";
    }
    setCustomErrors(newErrors);
  };

  const handleChange = (field, value) => {
    setData(field, value);
    validateField(field, value);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (customErrors.email || customErrors.password) return;
    if (countdown > 0) return; // block login during cooldown

    setModalState({ open: true, type: "loading" });

    if (data.remember) localStorage.setItem("rememberedEmail", data.email);
    else localStorage.removeItem("rememberedEmail");

    post(route("login"), {
      onSuccess: () => {
        setAttempts(0);
        setModalState({ open: true, type: "success" });
        setTimeout(() => setModalState({ open: false, type: "loading" }), 1500);
      },
      onError: () => {
        setAttempts((prev) => {
          const newCount = prev + 1;
          if (newCount >= 3 && canResetPassword) {
            setCountdown(30); // 10 seconds cooldown
            setModalState({ open: true, type: "suggestReset" });
          } else {
            setModalState({ open: true, type: "error" });
            setTimeout(() => setModalState({ open: false, type: "loading" }), 1500);
          }
          return newCount;
        });
      },
    });
  };

  return (
    <>
      <Head title="Login" />
      <Header />
{/* --- PROFESSIONAL MODAL --- */}
<Modal
  open={modalState.open}
  footer={null}
  closable={modalState.type === "suggestReset" || countdown === 0}
  onCancel={() => setModalState({ open: false, type: "loading" })}
  centered
  width={380}
  bodyStyle={{
    padding: "40px 30px",
    textAlign: "center",
  }}
  modalRender={(node) => (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.95)",
        borderRadius: "20px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        backdropFilter: "blur(10px)",
      }}
    >
      {node}
    </div>
  )}
>

  {/* --- LOADING STATE --- */}
  {modalState.type === "loading" && (
    <div className="animate-fadeIn flex flex-col items-center">
      <Spin size="large" />
      <p className="mt-4 text-gray-700 font-medium text-base tracking-wide">
        Authenticating...
      </p>
    </div>
  )}

  {/* --- SUCCESS STATE --- */}
  {modalState.type === "success" && (
    <div className="animate-bounceIn flex flex-col items-center">
      <div className="bg-gradient-to-br from-green-400 to-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-xl">
        <FiCheckCircle className="text-white text-5xl drop-shadow-lg" />
      </div>
      <p className="text-green-700 font-semibold text-lg mt-4">
        Login Successful!
      </p>
    </div>
  )}

  {/* --- ERROR STATE --- */}
  {modalState.type === "error" && (
    <div className="animate-shake flex flex-col items-center">
      <div className="bg-gradient-to-br from-red-400 to-red-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-xl">
        <FiXCircle className="text-white text-5xl drop-shadow-lg" />
      </div>
      <p className="text-red-600 font-semibold text-lg mt-4">
        Login Failed
      </p>
      <p className="text-sm text-gray-600 mt-1">
        Please check your credentials.
      </p>
    </div>
  )}

  {/* --- TOO MANY FAILED ATTEMPTS --- */}
  {modalState.type === "suggestReset" && (
    <div className="animate-fadeIn flex flex-col items-center">
      <div className="bg-gradient-to-br from-orange-400 to-red-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-xl">
        <FiLockIcon className="text-white text-5xl drop-shadow-lg" />
      </div>

      <p className="text-red-600 font-semibold text-lg mt-4">
        Too many failed attempts
      </p>

      <p className="text-gray-600 text-sm mt-2 mb-4 px-4">
        Please wait {countdown} second{countdown !== 1 ? "s" : ""} before
        trying again or reset your password.
      </p>

      {/* Countdown Progress */}
      <Progress
        percent={((10 - countdown) / 10) * 100}
        showInfo={false}
        strokeColor={{ from: "#f59e0b", to: "#ef4444" }}
        trailColor="#fde68a"
        strokeWidth={6}
        className="w-full mb-4"
      />

      {canResetPassword && (
        <Link href={route("password.request")}>
          <Button
            type="primary"
            className="bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold w-full"
            onClick={() => setModalState({ open: false, type: "loading" })}
          >
            Forgot Password
          </Button>
        </Link>
      )}
    </div>
  )}

</Modal>


      {/* --- MAIN CONTAINER --- */}
      <div className="min-h-screen flex items-center justify-center bg-white px-4 sm:px-6 py-10 -mt-10">
        <div
          className="
            relative
            mt-6
            w-full max-w-5xl
            flex flex-col md:flex-row overflow-hidden
            shadow-[0_0_50px_rgba(0,0,0,0.15)]
            border border-gray-200
            bg-white
            transition-all duration-500
            hover:shadow-[0_0_70px_rgba(0,0,0,0.25)]
            rounded-[30px_10px_30px_10px]
          "
        >

          {/* --- LEFT SIDE --- */}
          <div className="w-full md:w-1/2 px-6 sm:px-10 lg:px-14 py-8 lg:py-12 flex flex-col justify-center relative z-10">
            <h2 className="text-4xl font-extrabold mb-10 tracking-tight text-gray-900">
              Welcome Back 👋
            </h2>

            <form onSubmit={submit} className="space-y-10">
              {/* Email */}
              <div className="relative group">
                <InputLabel htmlFor="email" value="Email Address" className="text-gray-600" />
                <div className="relative mt-2">
                  <span className="absolute inset-y-0 left-1 flex items-center text-gray-500">
                    <FiMail size={18} />
                  </span>
                  <TextInput
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    className="
                      w-full bg-transparent border-0 border-b-2 border-gray-300 text-gray-800
                      pl-8 pr-3 py-2 focus:border-blue-600 focus:ring-0 transition-all duration-300
                      rounded-none group-hover:border-gray-400
                    "
                    placeholder="menro@gmail.com"
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
                <InputError
                  message={errors.email || customErrors.email}
                  className="mt-1 text-red-500"
                />
              </div>

              {/* Password */}
              <div className="relative group">
                <InputLabel htmlFor="password" value="Password" className="text-gray-600" />
                <div className="relative mt-2">
                  <span className="absolute inset-y-0 left-1 flex items-center text-gray-500">
                    <FiLock size={18} />
                  </span>
                  <TextInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={data.password}
                    className="
                      w-full bg-transparent border-0 border-b-2 border-gray-300 text-gray-800
                      pl-8 pr-8 py-2 focus:border-blue-600 focus:ring-0 transition-all duration-300
                      rounded-none group-hover:border-gray-400
                    "
                    placeholder="Enter your password"
                    onChange={(e) => handleChange("password", e.target.value)}
                  />
                  <span
                    className="absolute inset-y-0 right-2 flex items-center text-gray-400 cursor-pointer hover:text-blue-500 transition"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </span>
                </div>
                <div className="text-right mt-2">
                  {canResetPassword && (
                    <Link
                      href={route("password.request")}
                      className="text-sm text-blue-500 hover:text-blue-700 transition"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <InputError
                  message={errors.password || customErrors.password}
                  className="mt-1 text-red-500"
                />
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <Checkbox
                    name="remember"
                    checked={data.remember}
                    onChange={(e) => setData("remember", e.target.checked)}
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
              </div>

              {/* Submit */}
              <PrimaryButton
                className="
                  w-full justify-center bg-blue-600 hover:bg-blue-700 text-white py-3
                  rounded-[15px_5px_15px_5px] text-lg font-semibold transition-all duration-300
                  shadow-[0_6px_20px_rgba(37,99,235,0.4)]
                  hover:shadow-[0_8px_25px_rgba(37,99,235,0.6)]
                "
                disabled={processing || countdown > 0}
              >
                {countdown > 0
                  ? `Try again in ${countdown}s`
                  : processing
                  ? "Signing in..."
                  : "Sign In"}
              </PrimaryButton>

              {/* Download APK Button */}
              <a
                href="/apk/menro-app-v2.apk"
                className="
                  mt-4 inline-flex w-full items-center justify-center
                  border border-blue-600 text-blue-600 hover:bg-blue-50
                  rounded-[15px_5px_15px_5px] py-3 text-sm sm:text-base font-semibold
                  transition-all duration-300
                "
                download
              >
                Download Android App (APK)
              </a>
            </form>
          </div>

          {/* --- RIGHT SIDE --- */}
          <div className="hidden md:flex md:w-1/2 bg-gradient-to-b from-blue-600 to-blue-800 flex-col items-center justify-center px-8 text-center relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl"></div>
            <img
              src="/images/logo.png"
              alt="Logo"
              className="w-44 h-auto mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] relative z-10"
            />
            <h3 className="text-2xl font-semibold tracking-wide text-white relative z-10">
              Member Login
            </h3>
            <p className="text-sm text-gray-100 mt-2 relative z-10">
              Access your account securely and efficiently.
            </p>
            <div className="absolute bottom-6 text-xs text-gray-200">
              &copy; 2025 MENRO. All rights reserved.
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
