import { useEffect, useState, type FormEvent } from "react";
import "./AuthFlow.css";
import { getInterestOptions } from "../../api/catalog";
import { readResumeDraft, storeResumeDraft } from "../../api/studentProfile";
import ResumeUpload from "../../components/ResumeUpload";
import {
  ArrowRight,
  Briefcase,
  Check,
  GraduationCap,
  LockKeyhole,
  LogIn,
  LogOut,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import {
  login,
  register,
  type Account,
  type AccountType,
  type AuthSession,
  type Profile,
} from "../../api/auth";

type Screen = "signup" | "login" | "onboarding" | "welcome";

interface AuthFlowProps {
  screen: Screen;
  account?: Account | null;
  profile?: Profile | null;
  onNavigate: (path: string) => void;
  onAuthenticated: (session: AuthSession) => Promise<void>;
  onProfileSaved: (profile: Profile) => Promise<void>;
  onLogout: () => void;
}

export default function AuthFlow({
  screen,
  account,
  profile,
  onNavigate,
  onAuthenticated,
  onProfileSaved,
  onLogout,
}: AuthFlowProps) {
  const [accountType, setAccountType] = useState<AccountType>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [interests, setInterests] = useState<string[]>([]);
  const [interestOptions, setInterestOptions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resumeParsing, setResumeParsing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getInterestOptions()
      .then((options) => {
        if (!cancelled) setInterestOptions(options);
      })
      .catch((caught: unknown) => {
        if (!cancelled)
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load interest options.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isStudent = account?.accountType === "student";
  const accountLabel =
    account?.accountType === "student" ? "Student" : "Professional";

  function updateValue(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (screen === "signup" && password !== confirmPassword) {
      setError("Those passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const session =
        screen === "signup"
          ? await register(email, password, accountType)
          : await login(email, password);
      await onAuthenticated(session);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to continue right now.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitOnboarding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account) return;
    setError("");
    setBusy(true);
    try {
      const onboarding: Profile = {
        fullName: values.fullName ?? "",
        interests,
        onboardingCompleted: true,
        ...(isStudent
          ? {
              institution: values.institution ?? "",
              fieldOfStudy: values.fieldOfStudy ?? "",
              graduationYear: Number(values.graduationYear),
            }
          : {
              jobTitle: values.jobTitle ?? "",
              organization: values.organization ?? "",
              professionalFocus: values.professionalFocus ?? "",
              yearsExperience: Number(values.yearsExperience),
            }),
      };
      await onProfileSaved(onboarding);
      onNavigate("/welcome");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save your profile.",
      );
    } finally {
      setBusy(false);
    }
  }

  function toggleInterest(interest: string) {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  }

  const existingProfile = profile;
  const initialValues = (key: keyof Profile) => {
    const value = existingProfile?.[key];
    return typeof value === "string" || typeof value === "number"
      ? String(value)
      : "";
  };

  return (
    <main className="auth-shell">
      <header className="auth-topbar">
        <button
          className="brand-mark"
          type="button"
          onClick={() => onNavigate("/signup")}
          aria-label="Rungs home"
        >
          <span className="brand-symbol" aria-hidden="true">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M4 22L9 2M14 22l5-20" />
              <path
                d="M7.75 7L17.75 7M6.5 12L16.5 12M5.25 17L15.25 17"
                strokeLinecap="butt"
              />
            </svg>
          </span>
          <span>Rungs</span>
        </button>
        <div className="topbar-note">Connecting talent with opportunity</div>
        {screen === "welcome" ? (
          <button className="quiet-button" type="button" onClick={onLogout}>
            <LogOut aria-hidden="true" />
            Sign out
          </button>
        ) : screen === "login" ? (
          <button
            className="quiet-button"
            type="button"
            onClick={() => onNavigate("/signup")}
          >
            <UserPlus aria-hidden="true" />
            Create account
          </button>
        ) : (
          <button
            className="quiet-button"
            type="button"
            onClick={() => onNavigate("/login")}
          >
            <LogIn aria-hidden="true" />
            Sign in
          </button>
        )}
      </header>

      <div className="auth-content">
        <aside className="auth-aside">
          <div className="aside-rule">
            <span />
          </div>
          <h1>
            Turn your skills into real <em>value.</em>
          </h1>
          <p className="aside-copy">
            Recruiters give feedback to make the best candidates stand out.
          </p>
          <div className="aside-lines" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
        </aside>

        <section className="auth-panel" aria-live="polite">
          {screen === "signup" && (
            <>
              <p className="eyebrow">MAKE YOUR ACCOUNT</p>
              <h2>Start with your side of the table.</h2>
              <p className="panel-intro">
                Choose how you’ll use Rungs. We’ll tailor the next step to you.
              </p>
              <div
                className="account-type-select"
                role="group"
                aria-label="Choose account type"
              >
                <button
                  type="button"
                  className={
                    accountType === "student"
                      ? "type-option selected"
                      : "type-option"
                  }
                  onClick={() => setAccountType("student")}
                  aria-pressed={accountType === "student"}
                >
                  <GraduationCap className="option-icon" aria-hidden="true" />
                  <strong>Student</strong>
                  <span>Show what you've done and build credibility.</span>
                </button>
                <button
                  type="button"
                  className={
                    accountType === "professional"
                      ? "type-option selected"
                      : "type-option"
                  }
                  onClick={() => setAccountType("professional")}
                  aria-pressed={accountType === "professional"}
                >
                  <Briefcase className="option-icon" aria-hidden="true" />
                  <strong>Professional</strong>
                  <span>Mentor, recruit, or share your experience.</span>
                </button>
              </div>
              <form className="auth-form" onSubmit={submitCredentials}>
                <label className="field-label" htmlFor="signup-email">
                  Email address
                </label>
                <div className="input-with-icon">
                  <Mail aria-hidden="true" />
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
                <label className="field-label" htmlFor="signup-password">
                  Password
                </label>
                <div className="input-with-icon">
                  <LockKeyhole aria-hidden="true" />
                  <input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={8}
                    maxLength={128}
                    required
                  />
                </div>
                <label className="field-label" htmlFor="confirm-password">
                  Confirm password
                </label>
                <div className="input-with-icon">
                  <LockKeyhole aria-hidden="true" />
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={8}
                    maxLength={128}
                    required
                  />
                </div>
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="primary-button"
                  type="submit"
                  disabled={busy}
                >
                  {busy ? "Creating account…" : "Create account"}
                  <ArrowRight aria-hidden="true" />
                </button>
                <p className="form-footnote">
                  By continuing, you agree to use Rungs to represent your
                  experience honestly.
                </p>
              </form>
            </>
          )}

          {screen === "login" && (
            <>
              <p className="eyebrow">WELCOME BACK</p>
              <h2>Sign in to continue to your Rungs profile.</h2>
              <form
                className="auth-form login-form"
                onSubmit={submitCredentials}
              >
                <label className="field-label" htmlFor="login-email">
                  Email address
                </label>
                <div className="input-with-icon">
                  <Mail aria-hidden="true" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
                <label className="field-label" htmlFor="login-password">
                  Password
                </label>
                <div className="input-with-icon">
                  <LockKeyhole aria-hidden="true" />
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="primary-button"
                  type="submit"
                  disabled={busy}
                >
                  {busy ? "Signing in…" : "Sign in"}
                  <ArrowRight aria-hidden="true" />
                </button>
              </form>
            </>
          )}

          {screen === "onboarding" && account && (
            <>
              <div className="step-kicker">
                <span>ACCOUNT READY</span>
                <span>YOUR PROFILE · 1 OF 1</span>
              </div>
              <p className="eyebrow">{accountLabel.toUpperCase()} PROFILE</p>
              <h2>
                {isStudent
                  ? "Where are you building from?"
                  : "What experience can you share?"}
              </h2>
              <p className="panel-intro">
                A few details help us make your network and opportunities
                relevant.
              </p>
              <form
                className="auth-form onboarding-form"
                onSubmit={submitOnboarding}
              >
                <label className="field-label" htmlFor="full-name">
                  Full name
                </label>
                <input
                  id="full-name"
                  autoComplete="name"
                  value={values.fullName ?? initialValues("fullName")}
                  onChange={(event) =>
                    updateValue("fullName", event.target.value)
                  }
                  maxLength={120}
                  required
                />
                {isStudent ? (
                  <>
                    <label className="field-label" htmlFor="institution">
                      School or institution
                    </label>
                    <input
                      id="institution"
                      autoComplete="organization"
                      value={values.institution ?? initialValues("institution")}
                      onChange={(event) =>
                        updateValue("institution", event.target.value)
                      }
                      maxLength={120}
                      required
                    />
                    <div className="field-row">
                      <div>
                        <label className="field-label" htmlFor="field-of-study">
                          Field of study
                        </label>
                        <input
                          id="field-of-study"
                          value={
                            values.fieldOfStudy ?? initialValues("fieldOfStudy")
                          }
                          onChange={(event) =>
                            updateValue("fieldOfStudy", event.target.value)
                          }
                          maxLength={120}
                          required
                        />
                      </div>
                      <div>
                        <label
                          className="field-label"
                          htmlFor="graduation-year"
                        >
                          Grad year
                        </label>
                        <input
                          id="graduation-year"
                          type="number"
                          min="2020"
                          max="2040"
                          value={
                            values.graduationYear ??
                            initialValues("graduationYear")
                          }
                          onChange={(event) =>
                            updateValue("graduationYear", event.target.value)
                          }
                          required
                        />
                      </div>
                    </div>
                    <span className="field-label">Resume (optional)</span>
                    <p className="panel-intro">
                      We'll use it to fill in your profile. You can review
                      everything after this step.
                    </p>
                    <div className="mb-4">
                      <ResumeUpload
                        onParsingChange={setResumeParsing}
                        onParsed={(draft) => storeResumeDraft(draft)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="field-row">
                      <div>
                        <label className="field-label" htmlFor="job-title">
                          Job title
                        </label>
                        <input
                          id="job-title"
                          autoComplete="organization-title"
                          value={values.jobTitle ?? initialValues("jobTitle")}
                          onChange={(event) =>
                            updateValue("jobTitle", event.target.value)
                          }
                          maxLength={120}
                          required
                        />
                      </div>
                      <div>
                        <label className="field-label" htmlFor="organization">
                          Organization
                        </label>
                        <input
                          id="organization"
                          autoComplete="organization"
                          value={
                            values.organization ?? initialValues("organization")
                          }
                          onChange={(event) =>
                            updateValue("organization", event.target.value)
                          }
                          maxLength={120}
                          required
                        />
                      </div>
                    </div>
                    <label className="field-label" htmlFor="professional-focus">
                      Professional focus
                    </label>
                    <input
                      id="professional-focus"
                      value={
                        values.professionalFocus ??
                        initialValues("professionalFocus")
                      }
                      onChange={(event) =>
                        updateValue("professionalFocus", event.target.value)
                      }
                      maxLength={120}
                      required
                    />
                    <label className="field-label" htmlFor="years-experience">
                      Years of experience
                    </label>
                    <input
                      id="years-experience"
                      type="number"
                      min="0"
                      max="60"
                      value={
                        values.yearsExperience ??
                        initialValues("yearsExperience")
                      }
                      onChange={(event) =>
                        updateValue("yearsExperience", event.target.value)
                      }
                      required
                    />
                  </>
                )}
                <fieldset className="interest-fieldset">
                  <legend>What are you interested in?</legend>
                  {interestOptions.length === 0 ? (
                    <p className="panel-intro">
                      No interest options are available yet.
                    </p>
                  ) : (
                    <div className="interest-options">
                      {interestOptions.map((interest) => (
                        <button
                          type="button"
                          key={interest}
                          className={
                            interests.includes(interest)
                              ? "interest-chip active"
                              : "interest-chip"
                          }
                          onClick={() => toggleInterest(interest)}
                          aria-pressed={interests.includes(interest)}
                        >
                          {interests.includes(interest) && (
                            <Check aria-hidden="true" />
                          )}
                          {interest}
                        </button>
                      ))}
                    </div>
                  )}
                </fieldset>
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="primary-button"
                  type="submit"
                  disabled={busy || resumeParsing}
                >
                  {busy
                    ? "Saving your profile…"
                    : resumeParsing
                      ? "Reading your resume…"
                      : "Finish profile"}
                  <ArrowRight aria-hidden="true" />
                </button>
              </form>
            </>
          )}

          {screen === "welcome" && account && (
            <div className="welcome-state">
              <div className="completion-mark" aria-hidden="true">
                <Check />
              </div>
              <p className="eyebrow">PROFILE COMPLETE</p>
              <h2>
                You’re on your way,{" "}
                {profile?.fullName?.split(" ")[0] ?? accountLabel}.
              </h2>
              <p className="panel-intro">
                Your {accountLabel.toLowerCase()} account is set up. Your
                profile details are saved and ready for the next step.
              </p>
              <div className="profile-summary">
                <span className="summary-label">SIGNED IN AS</span>
                <strong>{profile?.fullName ?? account.email}</strong>
                <span>{account.email}</span>
                <span className="summary-divider" />
                <span className="summary-role">
                  {accountLabel} account · onboarding complete
                </span>
              </div>
              {account.accountType === "student" && readResumeDraft() ? (
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => onNavigate("/student/profile")}
                >
                  Review details from your resume
                  <ArrowRight aria-hidden="true" />
                </button>
              ) : (
                <button
                  className="primary-button"
                  type="button"
                  onClick={() =>
                    onNavigate(
                      account.accountType === "student"
                        ? "/student/overview"
                        : "/professional/feed",
                    )
                  }
                >
                  Continue to Rungs
                  <ArrowRight aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </section>
      </div>
      <footer className="auth-footer"></footer>
    </main>
  );
}
