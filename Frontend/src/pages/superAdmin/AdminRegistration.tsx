// Frontend/src/pages/superAdmin/AdminRegistration.tsx

import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon, Eye, EyeOff, Phone, User, Mail, Lock, Globe,
  Shield, CheckCircle2, ArrowRight, Sparkles, Users, Settings2,
  ChevronRight
} from "lucide-react";
// import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import LocationSelector from "@/components/ui/location-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { useAuth } from "@/hooks/useAuth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const formSchema = z.object({
  firstname: z.string().min(1, "First name is required").max(50, "First name too long"),
  lastname: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  country: z.tuple([z.string(), z.string().optional()]),
  phone: z.string().min(10, "Enter a valid phone number"),
  dateofbirth: z.date({ required_error: "Date of birth is required" }),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  referralCode: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const FEATURES = [
  { icon: Shield, title: "Secure Access", desc: "Role-based permissions with audit trail" },
  { icon: Users, title: "Team Management", desc: "Coordinate across clients and agents" },
  { icon: Settings2, title: "Full Control", desc: "Configure platform settings and policies" },
];

const STEPS = ["Personal Info", "Contact", "Credentials"];

export default function AdminRegistration() {
  const navigate = useNavigate();
  const { activeRole } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countryName, setCountryName] = useState("");
  const [stateName, setStateName] = useState("");
  const [step, setStep] = useState(0);
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dateofbirth: new Date(),
      firstname: "", lastname: "", phone: "", email: "", password: "", confirmPassword: "",
    },
  });

  useEffect(() => {
    form.reset({ dateofbirth: new Date(), firstname: "", lastname: "", phone: "", email: "", password: "", confirmPassword: "" });
    setCountryName(""); setStateName("");
  }, []);

  const goNext = async () => {
    let fields: (keyof z.infer<typeof formSchema>)[] = [];
    if (step === 0) fields = ["firstname", "lastname", "dateofbirth"];
    if (step === 1) fields = ["country", "phone"];
    const valid = await form.trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, 2));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      if (!["admin", "superadmin"].includes(activeRole || "")) throw new Error("Insufficient permissions");
      const token = localStorage.getItem(`${activeRole}Token`);
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`${API_BASE_URL}/api/auth/admin/signup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, country: [countryName, stateName] }),
      });

      if (!response.ok) throw new Error("Failed to create admin");
      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        toast.success("Admin account created successfully!", { duration: 4000 });
        setTimeout(() => navigate("/"), 3000);
      } else {
        toast.error(data.message || "Failed to register. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex" style={{ background: "var(--theme-bg-main)" }}>

      {/* ── Left Panel ──────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[42%] flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, color-mix(in srgb, var(--theme-primary) 18%, var(--theme-bg-sidebar)), var(--theme-bg-sidebar))" }}
      >
        {/* Decorative orbs */}
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, var(--theme-primary), transparent)" }} />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, var(--theme-primary), transparent)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-4"
          style={{ background: "radial-gradient(circle, var(--theme-primary), transparent)" }} />

        {/* Top logo / brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 relative z-10"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--theme-primary), var(--theme-primary-hover))" }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--theme-text-muted)" }}>Admin Portal</p>
            <p className="text-sm font-bold" style={{ color: "var(--theme-text-primary)" }}>Super Admin Console</p>
          </div>
        </motion.div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4" style={{ color: "var(--theme-primary)" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--theme-primary)" }}>
                New Registration
              </span>
            </div>
            <h1 className="text-4xl font-bold leading-tight mb-3" style={{ color: "var(--theme-text-primary)" }}>
              Create an<br />
              <span style={{ color: "var(--theme-primary)" }}>Admin Account</span>
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>
              Grant full platform access to a new administrator. Admins can manage clients, approve transactions, and configure platform settings.
            </p>
          </motion.div>

          {/* Feature list */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="space-y-4"
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.12 }}
                className="flex items-start gap-4 p-4 rounded-2xl"
                style={{ background: "color-mix(in srgb, var(--theme-primary) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--theme-primary) 20%, transparent)" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "color-mix(in srgb, var(--theme-primary) 20%, transparent)" }}>
                  <f.icon className="w-4 h-4" style={{ color: "var(--theme-primary)" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--theme-text-primary)" }}>{f.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--theme-text-muted)" }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Step indicator on left panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative z-10 flex items-center gap-3"
        >
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-300"
                style={{
                  background: i <= step ? "var(--theme-primary)" : "color-mix(in srgb, var(--theme-primary) 15%, transparent)",
                  color: i <= step ? "white" : "var(--theme-text-muted)",
                }}
              >
                {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className="text-xs font-medium" style={{ color: i === step ? "var(--theme-text-primary)" : "var(--theme-text-disabled)" }}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <ChevronRight className="w-3 h-3 mx-1" style={{ color: "var(--theme-text-disabled)" }} />
              )}
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Right Panel — Form ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center p-6 lg:p-12 overflow-y-auto">

        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--theme-primary), var(--theme-primary-hover))" }}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm" style={{ color: "var(--theme-text-primary)" }}>Admin Registration</span>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto text-center"
            >
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: "color-mix(in srgb, #10b981 15%, transparent)", border: "2px solid #10b981" }}>
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--theme-text-primary)" }}>Account Created!</h2>
              <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
                The new admin account has been set up. Redirecting shortly…
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-lg mx-auto w-full"
            >
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--theme-text-primary)" }}>
                  {STEPS[step]}
                </h2>
                <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
                  Step {step + 1} of {STEPS.length} — fill in the details below
                </p>

                {/* Progress bar */}
                <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--theme-border)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, var(--theme-primary), var(--theme-primary-hover))" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  />
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <AnimatePresence mode="wait">

                    {/* ── Step 0: Personal Info ── */}
                    {step === 0 && (
                      <motion.div
                        key="step0"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-5"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="firstname" render={({ field }) => (
                            <FormItem>
                              <FormLabel style={{ color: "var(--theme-text-muted)" }} className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                                <User className="w-3 h-3" /> First Name
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="John"
                                  className="h-11 text-sm"
                                  style={{ background: "var(--theme-bg-card)", border: "1px solid var(--theme-border)", color: "var(--theme-text-primary)" }}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="lastname" render={({ field }) => (
                            <FormItem>
                              <FormLabel style={{ color: "var(--theme-text-muted)" }} className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                                <User className="w-3 h-3" /> Last Name
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Doe"
                                  className="h-11 text-sm"
                                  style={{ background: "var(--theme-bg-card)", border: "1px solid var(--theme-border)", color: "var(--theme-text-primary)" }}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )} />
                        </div>

                        <FormField control={form.control} name="dateofbirth" render={({ field }) => (
                          <FormItem>
                            <FormLabel style={{ color: "var(--theme-text-muted)" }} className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                              <CalendarIcon className="w-3 h-3" /> Date of Birth
                            </FormLabel>
                            <FormControl>
                              <DatePicker value={field.value} onChange={field.onChange} className="h-11 w-full" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      </motion.div>
                    )}

                    {/* ── Step 1: Contact ── */}
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-5"
                      >
                        <FormField control={form.control} name="country" render={({ field }) => (
                          <FormItem>
                            <FormLabel style={{ color: "var(--theme-text-muted)" }} className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                              <Globe className="w-3 h-3" /> Location
                            </FormLabel>
                            <FormControl>
                              <div className="min-h-[44px]">
                                <LocationSelector
                                  onCountryChange={(country) => {
                                    setCountryName(country?.name || "");
                                    form.setValue(field.name, [country?.name || "", stateName || ""]);
                                  }}
                                  onStateChange={(state) => {
                                    setStateName(state?.name || "");
                                    form.setValue(field.name, [countryName || "", state?.name || ""]);
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem>
                            <FormLabel style={{ color: "var(--theme-text-muted)" }} className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                              <Phone className="w-3 h-3" /> Phone Number
                            </FormLabel>
                            <FormControl>
                              <PhoneInput placeholder="Enter phone number" defaultCountry="IN" className="h-11" {...field} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      </motion.div>
                    )}

                    {/* ── Step 2: Credentials ── */}
                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-5"
                      >
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem>
                            <FormLabel style={{ color: "var(--theme-text-muted)" }} className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                              <Mail className="w-3 h-3" /> Email Address
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="admin@company.com"
                                type="email"
                                className="h-11 text-sm"
                                style={{ background: "var(--theme-bg-card)", border: "1px solid var(--theme-border)", color: "var(--theme-text-primary)" }}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="password" render={({ field }) => (
                          <FormItem>
                            <FormLabel style={{ color: "var(--theme-text-muted)" }} className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                              <Lock className="w-3 h-3" /> Password
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="Min. 6 characters"
                                  type={showPassword ? "text" : "password"}
                                  className="h-11 text-sm pr-10"
                                  style={{ background: "var(--theme-bg-card)", border: "1px solid var(--theme-border)", color: "var(--theme-text-primary)" }}
                                  {...field}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2"
                                  style={{ color: "var(--theme-text-muted)" }}>
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                          <FormItem>
                            <FormLabel style={{ color: "var(--theme-text-muted)" }} className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                              <Lock className="w-3 h-3" /> Confirm Password
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="Repeat password"
                                  type={showConfirmPassword ? "text" : "password"}
                                  className="h-11 text-sm pr-10"
                                  style={{ background: "var(--theme-bg-card)", border: "1px solid var(--theme-border)", color: "var(--theme-text-primary)" }}
                                  {...field}
                                />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2"
                                  style={{ color: "var(--theme-text-muted)" }}>
                                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Navigation buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    {step > 0 && (
                      <button
                        type="button"
                        onClick={() => setStep((s) => s - 1)}
                        className="flex-1 h-11 rounded-xl text-sm font-semibold transition-all duration-200 border"
                        style={{ border: "1px solid var(--theme-border)", color: "var(--theme-text-muted)", background: "transparent" }}
                      >
                        Back
                      </button>
                    )}
                    {step < 2 ? (
                      <motion.button
                        type="button"
                        onClick={goNext}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
                        style={{ background: "linear-gradient(135deg, var(--theme-primary), var(--theme-primary-hover))" }}
                      >
                        Continue <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    ) : (
                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ background: "linear-gradient(135deg, var(--theme-primary), var(--theme-primary-hover))" }}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Creating…
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4" /> Create Admin Account
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </form>
              </Form>

              {/* Mobile step indicators */}
              <div className="lg:hidden flex items-center justify-center gap-2 mt-6">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: i === step ? "24px" : "8px",
                      background: i <= step ? "var(--theme-primary)" : "var(--theme-border)",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
