import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { getProfile } from "../../api/auth";
import ProjectCredibilityPanel, {
  VerifiedExperienceBadge,
} from "../../components/ProjectCredibility";
import ResumeUpload from "../../components/ResumeUpload";
import {
  clearResumeDraft,
  generateStudentTalent,
  getStudentProfile,
  getStudentReputation,
  indexStudentTalent,
  readResumeDraft,
  saveStudentProfile,
  StudentProfileRequestError,
  verifyStudentCredibility,
  type CredibilityReport,
  type SkillLevel,
  type StudentProfile,
  type StudentReputation,
  type StudentTalent,
} from "../../api/studentProfile";

const levels: SkillLevel[] = ["beginner", "intermediate", "advanced"];
const maxGithubAccounts = 5;

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-600 focus:outline-none";
const buttonClass =
  "rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50";
const primaryClass =
  "rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50";

function formatDate(value: string | null, emptyLabel = "Present") {
  if (!value) return emptyLabel;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatYears(start: number | null, end: number | null) {
  if (start && end) return `${start} – ${end}`;
  return String(start ?? end ?? "");
}

// ───────────── View ─────────────

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="border-b border-gray-200 pb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Entry({
  title,
  meta,
  children,
}: {
  title: string;
  meta: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="text-sm text-gray-500">{meta}</span>
      </div>
      {children}
    </div>
  );
}

function Description({ text }: { text: string }) {
  return text ? (
    <p className="mt-1 text-sm whitespace-pre-line text-gray-700">{text}</p>
  ) : null;
}

function TalentSkeleton() {
  return (
    <div
      role="status"
      aria-label="Generating student talent"
      aria-busy="true"
      className="grid gap-5 sm:grid-cols-2"
    >
      <span className="sr-only">Generating skill rankings…</span>
      {["Hard skills", "Soft skills"].map((title) => (
        <div key={title} className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          {[0, 1, 2].map((row) => (
            <div key={row} className="animate-pulse" aria-hidden="true">
              <div className="flex justify-between gap-4">
                <span className="h-4 w-2/5 rounded bg-gray-200" />
                <span className="h-4 w-10 rounded bg-gray-200" />
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-gray-200" />
              <div className="mt-2 h-3 w-4/5 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ProfileView({
  profile,
  fullName,
  studentTalent,
  reputation,
  reputationError,
  searchAttributeCount,
  searchIndexingError,
  talentGenerating,
  talentError,
  onRetryTalent,
  credibility,
  credibilityRunning,
  credibilityError,
  onVerifyCredibility,
}: {
  profile: StudentProfile;
  fullName: string;
  studentTalent: StudentTalent | null;
  reputation: StudentReputation | null;
  reputationError: string;
  searchAttributeCount: number;
  searchIndexingError: string;
  talentGenerating: boolean;
  talentError: string;
  onRetryTalent: () => void;
  credibility: CredibilityReport | null;
  credibilityRunning: boolean;
  credibilityError: string;
  onVerifyCredibility: () => void;
}) {
  const empty =
    !profile.headline &&
    !profile.summary &&
    !profile.learningGoals &&
    !profile.education.length &&
    !profile.jobs.length &&
    !profile.projects.length &&
    !profile.skills.length &&
    !profile.links.length;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">{fullName}</h1>
          {!credibilityRunning && (
            <VerifiedExperienceBadge projects={credibility?.projects} />
          )}
        </div>
        {profile.headline && (
          <p className="text-gray-700">{profile.headline}</p>
        )}
        {profile.location && (
          <p className="text-sm text-gray-500">{profile.location}</p>
        )}
        {((profile.githubUsernames?.length ?? 0) > 0 ||
          profile.links.length > 0) && (
          <p className="mt-1 flex flex-wrap gap-x-4 text-sm">
            {(profile.githubUsernames ?? []).map((username) => (
              <a
                key={username}
                href={`https://github.com/${username}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub · @{username}
              </a>
            ))}
            {profile.links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            ))}
          </p>
        )}
      </header>

      <Section title="Recruiter reputation">
        {reputationError ? (
          <p role="status" className="text-sm text-amber-800">
            {reputationError}
          </p>
        ) : reputation ? (
          <>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-xl font-semibold tabular-nums text-gray-900">
                {reputation.stars.toFixed(1)} / 5
              </p>
              <p className="text-sm text-gray-600">
                {reputation.reviewCount}{" "}
                {reputation.reviewCount === 1 ? "review" : "reviews"}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Ratings use a confidence-adjusted average; new profiles start at a
              neutral 3 stars.
            </p>
            {reputation.reviews.length > 0 ? (
              <ul className="flex flex-col divide-y divide-gray-200 border-y border-gray-200">
                {reputation.reviews.map((review) => (
                  <li key={review.id} className="py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium tabular-nums text-gray-800">
                        {review.rating} / 5 stars
                      </span>
                      <time
                        className="text-xs text-gray-500"
                        dateTime={review.updatedAt}
                      >
                        {new Date(review.updatedAt).toLocaleDateString()}
                      </time>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm text-gray-700">
                      {review.reviewText}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No written feedback yet.</p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500">Loading recruiter reputation…</p>
        )}
      </Section>

      {empty && (
        <p className="text-sm text-gray-500">
          Your profile is empty. Select Edit to add your experience.
        </p>
      )}

      {profile.summary && (
        <Section title="Summary">
          <Description text={profile.summary} />
        </Section>
      )}
      {profile.learningGoals && (
        <Section title="Mentor learning goals">
          <Description text={profile.learningGoals} />
        </Section>
      )}

      {profile.jobs.length > 0 && (
        <Section title="Experience">
          {profile.jobs.map((job, index) => (
            <Entry
              key={index}
              title={`${job.title} · ${job.company}`}
              meta={`${formatDate(job.startDate, "Date not set")} – ${formatDate(job.endDate)}`}
            >
              {job.location && (
                <p className="text-sm text-gray-500">{job.location}</p>
              )}
              <Description text={job.description} />
            </Entry>
          ))}
        </Section>
      )}

      {profile.projects.length > 0 && (
        <Section title="Projects">
          {profile.projects.map((project, index) => (
            <Entry key={index} title={project.name} meta="">
              {project.url && (
                <a
                  className="text-sm"
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {project.url}
                </a>
              )}
              <Description text={project.description} />
              {project.skills.length > 0 && (
                <p className="mt-1 flex flex-wrap gap-1.5">
                  {project.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700"
                    >
                      {skill}
                    </span>
                  ))}
                </p>
              )}
              {!credibilityRunning && credibility?.projects[index] && (
                <ProjectCredibilityPanel
                  credibility={credibility.projects[index]}
                />
              )}
            </Entry>
          ))}
          {credibilityRunning ? (
            <p role="status" className="text-sm text-gray-500">
              Checking GitHub commits for your projects…
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {credibilityError && (
                <p role="alert" className="text-sm text-red-700">
                  {credibilityError}
                </p>
              )}
              {!credibilityError && !profile.githubUsernames?.length && (
                <p className="text-sm text-gray-500">
                  Add your GitHub accounts (Edit) or link each project to its
                  repository so reviewers can verify your work.
                </p>
              )}
              {!credibilityError &&
                (credibility?.unavailableAccounts?.length ?? 0) > 0 && (
                  <p role="status" className="text-sm text-amber-800">
                    GitHub couldn't find{" "}
                    {credibility?.unavailableAccounts
                      ?.map((username) => `@${username}`)
                      .join(", ")}
                    , so those repositories weren't checked. Check the spelling
                    in Edit.
                  </p>
                )}
              {!credibilityError && credibility && (
                <p className="text-xs text-gray-500">
                  {
                    credibility.projects.filter(
                      (item) => item.status === "verified",
                    ).length
                  }{" "}
                  of {credibility.projects.length} projects commit-verified ·
                  Checked{" "}
                  {new Date(credibility.generatedAt).toLocaleDateString()}
                </p>
              )}
              <button
                type="button"
                className={buttonClass}
                onClick={onVerifyCredibility}
              >
                {credibility
                  ? "Re-check on GitHub"
                  : "Verify projects on GitHub"}
              </button>
            </div>
          )}
        </Section>
      )}

      {profile.education.length > 0 && (
        <Section title="Education">
          {profile.education.map((item, index) => (
            <Entry
              key={index}
              title={item.institution}
              meta={formatYears(item.startYear, item.endYear)}
            >
              <p className="text-sm text-gray-700">
                {[item.degree, item.field].filter(Boolean).join(", ")}
              </p>
              <Description text={item.description} />
            </Entry>
          ))}
        </Section>
      )}

      {profile.skills.length > 0 && (
        <Section title="Skills">
          <p className="flex flex-wrap gap-2">
            {profile.skills.map((skill, index) => (
              <span
                key={index}
                className="rounded-full border border-gray-200 px-2.5 py-0.5 text-sm"
              >
                {skill.name}{" "}
                <span className="text-xs text-gray-500">· {skill.level}</span>
              </span>
            ))}
          </p>
        </Section>
      )}

      <Section title="Student talent">
        {talentGenerating ? (
          <TalentSkeleton />
        ) : talentError ? (
          <div className="flex flex-wrap items-center gap-3">
            <p role="alert" className="text-sm text-red-700">
              {talentError}
            </p>
            <button
              type="button"
              className={buttonClass}
              onClick={onRetryTalent}
            >
              Retry talent generation
            </button>
          </div>
        ) : studentTalent ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              {(
                [
                  ["Hard skills", studentTalent.hardSkills],
                  ["Soft skills", studentTalent.softSkills],
                ] as const
              ).map(([title, skills]) => (
                <div key={title} className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold text-gray-800">
                    {title}
                  </h3>
                  {skills.length === 0 && (
                    <p className="text-sm text-gray-500">
                      No profile evidence yet.
                    </p>
                  )}
                  {skills.map((skill) => (
                    <div key={skill.name}>
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="font-medium text-gray-800">
                          {skill.name}
                        </span>
                        <span className="shrink-0 tabular-nums text-gray-600">
                          {skill.score}/100
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${skill.score}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        {skill.evidence}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Ranked by evidence strength · Updated{" "}
              {new Date(studentTalent.generatedAt).toLocaleDateString()}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-500">
            Save your profile to generate your skill rankings.
          </p>
        )}
        {studentTalent && searchIndexingError && (
          <p role="status" className="text-sm text-amber-800">
            {searchIndexingError}
          </p>
        )}
        {studentTalent && !searchIndexingError && searchAttributeCount > 0 && (
          <p role="status" className="text-sm text-gray-600">
            {searchAttributeCount} attributes are ready for search.
          </p>
        )}
        {studentTalent &&
          !searchIndexingError &&
          searchAttributeCount === 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <p role="status" className="text-sm text-gray-600">
                No search attributes are indexed yet.
              </p>
              <button
                type="button"
                className={buttonClass}
                onClick={onRetryTalent}
              >
                Prepare search attributes
              </button>
            </div>
          )}
      </Section>

        </div>
  );
}

// ───────────── Edit ─────────────

interface FieldControlProps {
  className?: string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

interface FormValidationError {
  field: string | null;
  message: string;
}

function fieldInputId(field: string) {
  return `student-profile-${field.replace(/[^a-zA-Z0-9-]/g, "-")}`;
}

function Field({
  label,
  children,
  fieldPath,
  validationError,
}: {
  label: string;
  children: ReactNode;
  fieldPath?: string;
  validationError?: FormValidationError | null;
}) {
  const hasError = Boolean(fieldPath && validationError?.field === fieldPath);
  const controlId = fieldPath ? fieldInputId(fieldPath) : undefined;
  const child = isValidElement<FieldControlProps>(children)
    ? (children as ReactElement<FieldControlProps>)
    : null;
  const control =
    child && controlId
      ? cloneElement(child, {
          id: controlId,
          className: `${child.props.className ?? ""}${hasError ? " border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600" : ""}`,
          "aria-invalid": hasError || undefined,
          "aria-describedby": hasError ? `${controlId}-error` : undefined,
        })
      : children;

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      {control}
      {hasError && (
        <span
          id={`${controlId}-error`}
          role="alert"
          className="text-xs text-red-700"
        >
          {validationError?.message}
        </span>
      )}
    </label>
  );
}

// An editable list: a section with a card per item, Remove buttons, and an Add button.
function ListEditor<T>({
  title,
  items,
  blank,
  onChange,
  render,
}: {
  title: string;
  items: T[];
  blank: T;
  onChange: (items: T[]) => void;
  render: (
    item: T,
    update: (patch: Partial<T>) => void,
    index: number,
  ) => ReactNode;
}) {
  return (
    <Section title={title}>
      {items.map((item, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-md border border-gray-200 p-3"
        >
          {render(
            item,
            (patch) =>
              onChange(
                items.map((existing, i) =>
                  i === index ? { ...existing, ...patch } : existing,
                ),
              ),
            index,
          )}
          <button
            type="button"
            className={`${buttonClass} self-start`}
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className={`${buttonClass} self-start`}
        onClick={() => onChange([...items, blank])}
      >
        Add {title.toLowerCase()}
      </button>
    </Section>
  );
}

const numberOrNull = (value: string) => (value === "" ? null : Number(value));

function ProfileForm({
  initial,
  saving,
  error,
  validationError,
  onSave,
  onCancel,
  onClearValidation,
}: {
  initial: StudentProfile;
  saving: boolean;
  error: string;
  validationError: FormValidationError | null;
  onSave: (profile: StudentProfile) => void;
  onCancel: () => void;
  onClearValidation: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const set = (patch: Partial<StudentProfile>) =>
    setDraft((current) => ({ ...current, ...patch }));
  // Always show at least one GitHub field; the backend drops blank rows on save.
  const githubRows = draft.githubUsernames?.length
    ? draft.githubUsernames
    : [""];
  const setGithubRows = (rows: string[]) => set({ githubUsernames: rows });

  useEffect(() => {
    if (!validationError?.field) return;
    const invalidControl = document.getElementById(
      fieldInputId(validationError.field),
    );
    invalidControl?.focus();
    invalidControl?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [validationError]);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
      }}
      onChange={() => {
        if (validationError) onClearValidation();
      }}
    >
      <Section title="About">
        <Field
          label="Headline"
          fieldPath="headline"
          validationError={validationError}
        >
          <input
            className={inputClass}
            maxLength={160}
            value={draft.headline}
            onChange={(e) => set({ headline: e.target.value })}
            placeholder="Mechanical engineering student"
          />
        </Field>
        <Field
          label="Location"
          fieldPath="location"
          validationError={validationError}
        >
          <input
            className={inputClass}
            maxLength={120}
            value={draft.location}
            onChange={(e) => set({ location: e.target.value })}
          />
        </Field>
        <div className="flex flex-col gap-2">
          {githubRows.map((username, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="flex-1">
                <Field
                  label={
                    index === 0
                      ? "GitHub username or profile link"
                      : `GitHub account ${index + 1}`
                  }
                  fieldPath={`githubUsernames.${index}`}
                  validationError={validationError}
                >
                  <input
                    className={inputClass}
                    maxLength={200}
                    value={username}
                    onChange={(e) =>
                      setGithubRows(
                        githubRows.map((row, i) =>
                          i === index ? e.target.value : row,
                        ),
                      )
                    }
                    placeholder={
                      index === 0
                        ? "octocat or https://github.com/octocat"
                        : "Another account, e.g. a school or work profile"
                    }
                  />
                </Field>
              </div>
              {githubRows.length > 1 && (
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() =>
                    setGithubRows(githubRows.filter((_, i) => i !== index))
                  }
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {githubRows.length < maxGithubAccounts && (
            <button
              type="button"
              className={`${buttonClass} self-start`}
              onClick={() => setGithubRows([...githubRows, ""])}
            >
              Add another GitHub account
            </button>
          )}
          <p className="text-xs text-gray-500">
            Projects are checked against repositories from every account you
            list.
          </p>
        </div>
        <Field
          label="Summary"
          fieldPath="summary"
          validationError={validationError}
        >
          <textarea
            className={inputClass}
            rows={4}
            maxLength={2000}
            value={draft.summary}
            onChange={(e) => set({ summary: e.target.value })}
          />
        </Field>
        <Field
          label="What would you like to learn from a mentor?"
          fieldPath="learningGoals"
          validationError={validationError}
        >
          <textarea
            className={inputClass}
            rows={3}
            maxLength={2000}
            value={draft.learningGoals}
            onChange={(e) => set({ learningGoals: e.target.value })}
            placeholder="Topics or skills you want guidance on."
          />
        </Field>
      </Section>

      <ListEditor
        title="Experience"
        items={draft.jobs}
        onChange={(jobs) => set({ jobs })}
        blank={{
          title: "",
          company: "",
          location: "",
          startDate: "",
          endDate: null,
          description: "",
        }}
        render={(job, update, index) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Title"
                fieldPath={`jobs.${index}.title`}
                validationError={validationError}
              >
                <input
                  required
                  className={inputClass}
                  maxLength={120}
                  value={job.title}
                  onChange={(e) => update({ title: e.target.value })}
                />
              </Field>
              <Field
                label="Company"
                fieldPath={`jobs.${index}.company`}
                validationError={validationError}
              >
                <input
                  required
                  className={inputClass}
                  maxLength={120}
                  value={job.company}
                  onChange={(e) => update({ company: e.target.value })}
                />
              </Field>
              <Field
                label="Location"
                fieldPath={`jobs.${index}.location`}
                validationError={validationError}
              >
                <input
                  className={inputClass}
                  maxLength={120}
                  value={job.location}
                  onChange={(e) => update({ location: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Start date"
                  fieldPath={`jobs.${index}.startDate`}
                  validationError={validationError}
                >
                  <input
                    required
                    type="date"
                    className={inputClass}
                    value={job.startDate}
                    onChange={(e) => update({ startDate: e.target.value })}
                  />
                </Field>
                <Field
                  label="End date"
                  fieldPath={`jobs.${index}.endDate`}
                  validationError={validationError}
                >
                  <input
                    type="date"
                    className={inputClass}
                    value={job.endDate ?? ""}
                    min={job.startDate || undefined}
                    onChange={(e) =>
                      update({ endDate: e.target.value || null })
                    }
                  />
                </Field>
              </div>
            </div>
            <p className="-mt-1 text-xs text-gray-500">
              Leave End empty for a current job.
            </p>
            <Field
              label="Description"
              fieldPath={`jobs.${index}.description`}
              validationError={validationError}
            >
              <textarea
                className={inputClass}
                rows={3}
                maxLength={2000}
                value={job.description}
                onChange={(e) => update({ description: e.target.value })}
              />
            </Field>
          </>
        )}
      />

      <ListEditor
        title="Projects"
        items={draft.projects}
        onChange={(projects) => set({ projects })}
        blank={{ name: "", description: "", url: "", skills: [] }}
        render={(project, update, index) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Name"
                fieldPath={`projects.${index}.name`}
                validationError={validationError}
              >
                <input
                  required
                  className={inputClass}
                  maxLength={120}
                  value={project.name}
                  onChange={(e) => update({ name: e.target.value })}
                />
              </Field>
              <Field
                label="GitHub repository or demo URL"
                fieldPath={`projects.${index}.url`}
                validationError={validationError}
              >
                <input
                  type="url"
                  className={inputClass}
                  maxLength={500}
                  value={project.url}
                  onChange={(e) => update({ url: e.target.value })}
                  placeholder="https://github.com/you/project"
                />
              </Field>
            </div>
            <Field
              label="Skills used (comma separated)"
              fieldPath={`projects.${index}.skills`}
              validationError={validationError}
            >
              <input
                className={inputClass}
                defaultValue={project.skills.join(", ")}
                onBlur={(e) =>
                  update({
                    skills: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
            <Field
              label="Description"
              fieldPath={`projects.${index}.description`}
              validationError={validationError}
            >
              <textarea
                className={inputClass}
                rows={3}
                maxLength={2000}
                value={project.description}
                onChange={(e) => update({ description: e.target.value })}
              />
            </Field>
          </>
        )}
      />

      <ListEditor
        title="Education"
        items={draft.education}
        onChange={(education) => set({ education })}
        blank={{
          institution: "",
          degree: "",
          field: "",
          startYear: null,
          endYear: null,
          description: "",
        }}
        render={(item, update, index) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Institution"
                fieldPath={`education.${index}.institution`}
                validationError={validationError}
              >
                <input
                  required
                  className={inputClass}
                  maxLength={120}
                  value={item.institution}
                  onChange={(e) => update({ institution: e.target.value })}
                />
              </Field>
              <Field
                label="Degree"
                fieldPath={`education.${index}.degree`}
                validationError={validationError}
              >
                <input
                  className={inputClass}
                  maxLength={120}
                  value={item.degree}
                  onChange={(e) => update({ degree: e.target.value })}
                  placeholder="BSc"
                />
              </Field>
              <Field
                label="Field of study"
                fieldPath={`education.${index}.field`}
                validationError={validationError}
              >
                <input
                  className={inputClass}
                  maxLength={120}
                  value={item.field}
                  onChange={(e) => update({ field: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Start year"
                  fieldPath={`education.${index}.startYear`}
                  validationError={validationError}
                >
                  <input
                    type="number"
                    min={1950}
                    max={2100}
                    className={inputClass}
                    value={item.startYear ?? ""}
                    onChange={(e) =>
                      update({ startYear: numberOrNull(e.target.value) })
                    }
                  />
                </Field>
                <Field
                  label="End year"
                  fieldPath={`education.${index}.endYear`}
                  validationError={validationError}
                >
                  <input
                    type="number"
                    min={1950}
                    max={2100}
                    className={inputClass}
                    value={item.endYear ?? ""}
                    onChange={(e) =>
                      update({ endYear: numberOrNull(e.target.value) })
                    }
                  />
                </Field>
              </div>
            </div>
            <Field
              label="Description"
              fieldPath={`education.${index}.description`}
              validationError={validationError}
            >
              <textarea
                className={inputClass}
                rows={2}
                maxLength={1000}
                value={item.description}
                onChange={(e) => update({ description: e.target.value })}
              />
            </Field>
          </>
        )}
      />

      <ListEditor
        title="Skills"
        items={draft.skills}
        onChange={(skills) => set({ skills })}
        blank={{ name: "", level: "beginner" as SkillLevel }}
        render={(skill, update, index) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Skill"
              fieldPath={`skills.${index}.name`}
              validationError={validationError}
            >
              <input
                required
                className={inputClass}
                maxLength={60}
                value={skill.name}
                onChange={(e) => update({ name: e.target.value })}
              />
            </Field>
            <Field
              label="Level"
              fieldPath={`skills.${index}.level`}
              validationError={validationError}
            >
              <select
                className={inputClass}
                value={skill.level}
                onChange={(e) =>
                  update({ level: e.target.value as SkillLevel })
                }
              >
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}
      />

      <ListEditor
        title="Links"
        items={draft.links}
        onChange={(links) => set({ links })}
        blank={{ label: "", url: "" }}
        render={(link, update, index) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Label"
              fieldPath={`links.${index}.label`}
              validationError={validationError}
            >
              <input
                required
                className={inputClass}
                maxLength={60}
                value={link.label}
                onChange={(e) => update({ label: e.target.value })}
                placeholder="GitHub"
              />
            </Field>
            <Field
              label="URL"
              fieldPath={`links.${index}.url`}
              validationError={validationError}
            >
              <input
                required
                type="url"
                className={inputClass}
                maxLength={500}
                value={link.url}
                onChange={(e) => update({ url: e.target.value })}
                placeholder="https://"
              />
            </Field>
          </div>
        )}
      />

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {validationError && !validationError.field && (
        <p role="alert" className="text-sm text-red-700">
          {validationError.message}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" className={primaryClass} disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ───────────── Page ─────────────

export default function Profile() {
  const [fullName, setFullName] = useState("");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [studentTalent, setStudentTalent] = useState<StudentTalent | null>(
    null,
  );
  const [reputation, setReputation] = useState<StudentReputation | null>(null);
  const [reputationError, setReputationError] = useState("");
  const [searchAttributeCount, setSearchAttributeCount] = useState(0);
  const [searchIndexingError, setSearchIndexingError] = useState("");
  // A parsed resume (from onboarding, or the upload at the bottom of this page)
  // opens straight into the form for review.
  const [resumeDraft, setResumeDraft] = useState<StudentProfile | null>(() =>
    readResumeDraft(),
  );
  const [editing, setEditing] = useState(() => resumeDraft !== null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [validationError, setValidationError] =
    useState<FormValidationError | null>(null);
  const [talentGenerating, setTalentGenerating] = useState(false);
  const [talentError, setTalentError] = useState("");
  const talentRequestId = useRef(0);
  const [credibility, setCredibility] = useState<CredibilityReport | null>(
    null,
  );
  const [credibilityRunning, setCredibilityRunning] = useState(false);
  const [credibilityError, setCredibilityError] = useState("");
  const credibilityRequestId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("talshift.session") ?? "";
    Promise.all([getStudentProfile(), getProfile(token)])
      .then(([result, account]) => {
        if (cancelled) return;
        setProfile(result.profile);
        setStudentTalent(result.studentTalent);
        setCredibility(result.credibility);
        setSearchAttributeCount(result.searchAttributeCount);
        setFullName(account.profile?.fullName ?? "");
      })
      .catch((caught: unknown) => {
        if (!cancelled)
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load your profile.",
          );
      });
    getStudentReputation()
      .then((result) => {
        if (!cancelled) setReputation(result);
      })
      .catch((caught: unknown) => {
        if (!cancelled)
          setReputationError(
            caught instanceof Error
              ? caught.message
              : "Unable to load recruiter reputation.",
          );
      });
    return () => {
      cancelled = true;
      talentRequestId.current += 1;
      credibilityRequestId.current += 1;
    };
  }, []);

  async function refreshTalent(indexOnly = Boolean(studentTalent)) {
    const requestId = ++talentRequestId.current;
    setTalentGenerating(true);
    setTalentError("");
    try {
      const result = indexOnly
        ? await indexStudentTalent()
        : await generateStudentTalent();
      if (requestId === talentRequestId.current) {
        setStudentTalent(result.studentTalent);
        setSearchAttributeCount(result.searchAttributeCount);
        setSearchIndexingError(result.searchIndexingError ?? "");
      }
    } catch (caught) {
      if (requestId === talentRequestId.current) {
        setTalentError(
          caught instanceof Error
            ? caught.message
            : "Unable to generate talent rankings.",
        );
      }
    } finally {
      if (requestId === talentRequestId.current) setTalentGenerating(false);
    }
  }

  async function refreshCredibility() {
    const requestId = ++credibilityRequestId.current;
    setCredibilityRunning(true);
    setCredibilityError("");
    try {
      const result = await verifyStudentCredibility();
      if (requestId === credibilityRequestId.current) setCredibility(result);
    } catch (caught) {
      if (requestId === credibilityRequestId.current) {
        setCredibilityError(
          caught instanceof Error
            ? caught.message
            : "Unable to verify your projects on GitHub.",
        );
      }
    } finally {
      if (requestId === credibilityRequestId.current)
        setCredibilityRunning(false);
    }
  }

  async function save(draft: StudentProfile) {
    setSaving(true);
    setError("");
    setValidationError(null);
    try {
      const result = await saveStudentProfile(draft);
      setProfile(result.profile);
      setStudentTalent(result.studentTalent);
      setSearchAttributeCount(result.searchAttributeCount);
      setSearchIndexingError("");
      setTalentError("");
      setCredibility(result.credibility);
      setCredibilityError("");
      setEditing(false);
      clearResumeDraft();
      setResumeDraft(null);
      void refreshTalent(false);
      if (result.profile.projects.length > 0) void refreshCredibility();
    } catch (caught) {
      if (caught instanceof StudentProfileRequestError && caught.field) {
        setValidationError({ field: caught.field, message: caught.message });
      } else {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to save your profile.",
        );
      }
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return error ? (
      <p role="alert" className="text-sm text-red-700">
        {error}
      </p>
    ) : (
      <p className="text-sm text-gray-500">Loading…</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {editing ? (
        <>
          {resumeDraft && (
            <p
              role="status"
              className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900"
            >
              We filled in your profile from your resume. Check each section,
              fix anything that's off, then save. Entries already on your
              profile that weren't on the resume are kept below the new ones.
            </p>
          )}
          <ProfileForm
            initial={resumeDraft ?? profile}
            saving={saving}
            error={error}
            validationError={validationError}
            onSave={save}
            onCancel={() => {
              setEditing(false);
              setError("");
              setValidationError(null);
              clearResumeDraft();
              setResumeDraft(null);
            }}
            onClearValidation={() => setValidationError(null)}
          />
        </>
      ) : (
        <>
          <button
            type="button"
            className={`${buttonClass} self-end`}
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
          <ProfileView
            profile={profile}
            fullName={fullName}
            studentTalent={studentTalent}
            reputation={reputation}
            reputationError={reputationError}
            searchAttributeCount={searchAttributeCount}
            searchIndexingError={searchIndexingError}
            talentGenerating={talentGenerating}
            talentError={talentError}
            onRetryTalent={() => void refreshTalent()}
            credibility={credibility}
            credibilityRunning={credibilityRunning}
            credibilityError={credibilityError}
            onVerifyCredibility={() => void refreshCredibility()}
          />
          <section className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold text-gray-900">Resume</h2>
            <p className="text-sm text-gray-600">
              Upload your latest resume and we'll fill in your profile's
              experience, projects, education, skills, and links. You'll review
              everything before it's saved, and anything already on your profile
              that isn't on this resume is kept.
            </p>
            <ResumeUpload
              onParsed={(draft) => {
                setResumeDraft(draft);
                setEditing(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </section>
        </>
      )}
    </div>
  );
}
