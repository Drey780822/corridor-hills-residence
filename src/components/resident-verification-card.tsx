import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  UserCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import {
  ALL_BLOCKS,
  getBlockDescription,
  normalizeUnit,
  parseUnit,
  verifyResident,
} from "../lib/residence-data";
import { useResidentSession } from "../lib/session";
import type { Room } from "../types/residence";
import { toast } from "sonner";

interface ResidentVerificationCardProps {
  onVerified?: () => void;
  inline?: boolean;
}

export function ResidentVerificationCard({
  onVerified,
  inline = false,
}: ResidentVerificationCardProps) {
  const { session, isVerified, setSession, clearSession } = useResidentSession();

  // Verification step: 1 (Unit), 2 (Room), 3 (Student Number)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form inputs
  const [unitInput, setUnitInput] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [studentNumberInput, setStudentNumberInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick fill helper for testing/evaluating
  const fillDemoResident = () => {
    setUnitInput("F301");
    setSelectedRoom("C");
    setStudentNumberInput("220123456");
    setErrorMsg(null);
    setStep(3);
    toast.info("Demo resident details filled (F301, Room C, 220123456)");
  };

  const handleUnitSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const parsed = parseUnit(unitInput);
    if (!parsed.valid) {
      setErrorMsg(parsed.error || "Please enter a valid unit (e.g. F301)");
      return;
    }

    setUnitInput(parsed.unitNumber!);
    setStep(2);
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    setErrorMsg(null);
    setStep(3);
  };

  const handleFinalVerification = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!unitInput || !selectedRoom || !studentNumberInput) {
      setErrorMsg("Please complete all verification steps.");
      return;
    }

    setLoading(true);

    try {
      const res = await verifyResident(unitInput, selectedRoom, studentNumberInput);

      if (res.success && res.session) {
        setSession(res.session);
        toast.success(`Verified! Welcome to Corridor Hills, ${res.session.location}`);
        if (onVerified) {
          onVerified();
        }
      } else {
        setErrorMsg(
          res.error ||
            "We couldn't verify those details. Please check your unit, room and student number.",
        );
      }
    } catch {
      setErrorMsg(
        "Something went wrong while verifying your details. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetVerification = () => {
    clearSession();
    setStep(1);
    setUnitInput("");
    setSelectedRoom(null);
    setStudentNumberInput("");
    setErrorMsg(null);
  };

  // If already verified, show the verified confirmation badge
  if (isVerified && session) {
    return (
      <div
        className={`overflow-hidden rounded-2xl border border-teal-500/30 bg-[#0B1E38]/95 backdrop-blur-md p-6 shadow-xl text-slate-100 transition-all ${
          inline ? "" : "my-6"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  Resident Verified
                </span>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-400" />
                <span className="text-xs text-slate-400">Active Session</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white">
                {session.location}
              </h2>
              <p className="text-sm font-medium text-slate-300">
                Corridor Hills Residence • {getBlockDescription(session.block)}
              </p>
            </div>
          </div>

          <button
            onClick={handleResetVerification}
            className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
            title="Switch resident"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Switch</span>
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div className="text-xs text-slate-400">
            Student Number:{" "}
            <strong className="text-white">••••{session.studentNumber.slice(-4)}</strong>
            <span className="mx-2">•</span>
            Floor: <strong className="text-white">{session.floor}</strong>
            <span className="mx-2">•</span>
            Room: <strong className="text-white">{session.room}</strong>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400">
            <Sparkles className="h-3.5 w-3.5" />
            Ready for maintenance requests
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-white/10 bg-[#0B1E38]/95 backdrop-blur-md shadow-2xl text-slate-100 ${
        inline ? "" : "my-6"
      }`}
    >
      {/* Header */}
      <div className="border-b border-white/10 bg-[#061426]/70 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400">
            <ShieldCheck className="h-4 w-4" />
            Resident Verification
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-slate-300 border border-white/15">
            Step {step} of 3
          </span>
        </div>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
          {step === 1 && "Where do you stay?"}
          {step === 2 && "Which room in your unit?"}
          {step === 3 && "Enter your TUT student number"}
        </h2>
        <p className="mt-1 text-sm text-slate-300">
          {step === 1 && "Enter your Corridor Hills unit (e.g. F301, E204, A101)."}
          {step === 2 && `Unit ${unitInput}: select your allocated bedroom.`}
          {step === 3 &&
            "We'll securely verify your identity with Tshwane University of Technology records."}
        </p>
      </div>

      {/* Body / Wizard Steps */}
      <div className="p-5 sm:p-6">
        {/* Progress pills */}
        <div className="mb-6 flex gap-2">
          <div
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step >= 1 ? "bg-[#10A080]" : "bg-white/10"
            }`}
          />
          <div
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step >= 2 ? "bg-[#10A080]" : "bg-white/10"
            }`}
          />
          <div
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step >= 3 ? "bg-[#10A080]" : "bg-white/10"
            }`}
          />
        </div>

        {errorMsg && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive animate-in fade-in">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {/* STEP 1: Unit input */}
        {step === 1 && (
          <form onSubmit={handleUnitSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="unit-input"
                className="block text-xs font-bold uppercase tracking-wider text-slate-400"
              >
                Unit Number
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <input
                  id="unit-input"
                  type="text"
                  placeholder="e.g. F301"
                  value={unitInput}
                  onChange={(e) => {
                    setUnitInput(e.target.value);
                    setErrorMsg(null);
                  }}
                  autoFocus
                  className="w-full rounded-xl border border-white/20 bg-[#061426] py-3.5 pl-11 pr-4 text-lg font-bold tracking-wide text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Format: Block (A–F) + Floor (1–4) + Unit (e.g. F301 = Block F, Floor 3, Unit 01).
              </p>
            </div>

            {/* Quick Block Reference chips */}
            <div>
              <span className="text-xs font-semibold text-slate-400">Residence Blocks:</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ALL_BLOCKS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      setUnitInput(`${b}301`);
                      setErrorMsg(null);
                    }}
                    className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300 transition-colors hover:border-teal-400/50 hover:bg-teal-500/10 hover:text-white"
                  >
                    Block {b} {b <= "D" ? "(Female)" : "(Male)"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={fillDemoResident}
                className="text-xs font-medium text-teal-400 underline-offset-4 hover:underline"
              >
                Use sample resident (F301C)
              </button>
              <button
                type="submit"
                disabled={!unitInput.trim()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10A080] px-5 text-sm font-extrabold text-[#061325] shadow-lg shadow-teal-950/40 transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-50 hover:bg-[#12b38f]"
              >
                <span>Continue to Room</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Room selection */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-xl bg-[#061426]/70 px-3.5 py-2 text-xs text-slate-300 border border-white/10">
              <span>
                Selected Unit: <strong className="text-white">{unitInput}</strong>
              </span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="font-semibold text-teal-400 hover:underline"
              >
                Change
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Select Bedroom
              </label>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {(["A", "B", "C"] as Room[]).map((r) => {
                  const isSelected = selectedRoom === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoomSelect(r)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-all active:scale-95 ${
                        isSelected
                          ? "border-teal-400 bg-teal-500/20 text-teal-300 ring-2 ring-teal-500/30"
                          : "border-white/10 bg-[#061426]/70 hover:border-teal-400/50 hover:bg-white/5 text-white"
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Room
                      </span>
                      <span className="text-3xl font-black tracking-tight text-white">{r}</span>
                      <span className="mt-1 text-[11px] text-slate-400">
                        {unitInput}
                        {r}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-center text-xs text-slate-400">
                Each unit contains Rooms A, B, and C (2 residents per room).
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-slate-400 hover:text-white"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Student number */}
        {step === 3 && (
          <form onSubmit={handleFinalVerification} className="space-y-5">
            <div className="flex items-center justify-between rounded-xl bg-[#061426]/70 px-3.5 py-2 text-xs text-slate-300 border border-white/10">
              <span>
                Location:{" "}
                <strong className="text-white">
                  {unitInput}
                  {selectedRoom}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="font-semibold text-teal-400 hover:underline"
              >
                Change Room
              </button>
            </div>

            <div>
              <label
                htmlFor="student-number"
                className="block text-xs font-bold uppercase tracking-wider text-slate-400"
              >
                Official TUT Student Number
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <UserCheck className="h-5 w-5" />
                </div>
                <input
                  id="student-number"
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 220123456"
                  maxLength={10}
                  value={studentNumberInput}
                  onChange={(e) => {
                    setStudentNumberInput(e.target.value);
                    setErrorMsg(null);
                  }}
                  autoFocus
                  className="w-full rounded-xl border border-white/20 bg-[#061426] py-3.5 pl-11 pr-4 text-lg font-bold tracking-wide text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Your 9-digit Tshwane University of Technology student number.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={loading}
                className="text-xs font-semibold text-slate-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !studentNumberInput.trim()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10A080] px-6 text-sm font-extrabold text-[#061325] shadow-lg shadow-teal-950/40 transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-50 hover:bg-[#12b38f]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#061325]" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
