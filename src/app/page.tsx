"use client";

import {
  ArrowDownUp,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Filter,
  LayoutDashboard,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { AuthScreen } from "@/app/auth-screen";
import { authClient } from "@/lib/auth-client";
import { applicationStages, type ApplicationStage } from "@/lib/applications";

type Stage = ApplicationStage;

type Application = {
  id: string;
  company: string;
  role: string;
  location: string;
  stage: Stage;
  appliedAt: string;
  contact: string;
  contactTitle: string;
  contactEmail: string;
  nextStep: string;
  nextStepDate: string;
  source: string;
  notes: string;
  color: string;
  initials: string;
};

const stages = applicationStages;

const blankApplication: Omit<Application, "id" | "color" | "initials"> = {
  company: "",
  role: "",
  location: "",
  stage: "Applied",
  appliedAt: new Date().toISOString().slice(0, 10),
  contact: "",
  contactTitle: "",
  contactEmail: "",
  nextStep: "",
  nextStepDate: "",
  source: "",
  notes: "",
};

const stageClass: Record<Stage, string> = {
  Applied: "stage-applied",
  Interview: "stage-interview",
  Offer: "stage-offer",
  Rejected: "stage-rejected",
  Saved: "stage-saved",
};

const colorChoices = ["lavender", "ink", "mint", "peach", "blue", "coral"];

type ApplicationRecord = Omit<Application, "color" | "initials">;

function decorateApplication(record: ApplicationRecord, index: number): Application {
  return {
    ...record,
    color: colorChoices[index % colorChoices.length],
    initials: makeInitials(record.company),
  };
}

async function responseError(response: Response, fallback: string) {
  try {
    const result = (await response.json()) as { error?: string };
    return result.error || fallback;
  } catch {
    return fallback;
  }
}

function formatDate(date: string) {
  if (!date) return "No date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(`${date}T12:00:00`),
  );
}

function makeInitials(company: string) {
  return company
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function Dashboard({ user }: { user: { name: string; email: string } }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [activeView, setActiveView] = useState<"Overview" | "Applications">("Overview");
  const [activeStage, setActiveStage] = useState<"All" | Stage>("All");
  const [query, setQuery] = useState("");
  const [oldestFirst, setOldestFirst] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [form, setForm] = useState(blankApplication);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/applications", { cache: "no-store" });
        if (!response.ok) throw new Error(await responseError(response, "Applications could not be loaded."));
        const records = (await response.json()) as ApplicationRecord[];
        if (!cancelled) setApplications(records.map(decorateApplication));
      } catch (error) {
        console.error("Unable to load this user's applications.");
        if (!cancelled) {
          setNotice(error instanceof Error ? error.message : "Applications could not be loaded.");
        }
      } finally {
        if (!cancelled) setLoadingApplications(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return applications
      .filter((application) => activeStage === "All" || application.stage === activeStage)
      .filter((application) => {
        if (!normalizedQuery) return true;
        return [
          application.company,
          application.role,
          application.contact,
          application.location,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) =>
        oldestFirst
          ? a.appliedAt.localeCompare(b.appliedAt)
          : b.appliedAt.localeCompare(a.appliedAt),
      );
  }, [applications, activeStage, oldestFirst, query]);

  const counts = useMemo(
    () =>
      stages.reduce(
        (result, stage) => {
          result[stage] = applications.filter((application) => application.stage === stage).length;
          return result;
        },
        { Applied: 0, Interview: 0, Offer: 0, Rejected: 0, Saved: 0 } as Record<Stage, number>,
      ),
    [applications],
  );

  const upcoming = useMemo(
    () =>
      applications
        .filter((application) => application.nextStepDate && application.stage !== "Rejected")
        .sort((a, b) => a.nextStepDate.localeCompare(b.nextStepDate))
        .slice(0, 3),
    [applications],
  );

  function openNewApplication() {
    setEditing(null);
    setForm({ ...blankApplication, appliedAt: new Date().toISOString().slice(0, 10) });
    setModalOpen(true);
  }

  function openEditApplication(application: Application) {
    setEditing(application);
    setForm({
      company: application.company,
      role: application.role,
      location: application.location,
      stage: application.stage,
      appliedAt: application.appliedAt,
      contact: application.contact,
      contactTitle: application.contactTitle,
      contactEmail: application.contactEmail,
      nextStep: application.nextStep,
      nextStepDate: application.nextStepDate,
      source: application.source,
      notes: application.notes,
    });
    setModalOpen(true);
  }

  async function saveApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const company = form.company.trim();
    const role = form.role.trim();
    if (!company || !role) return;
    const payload = {
      ...form,
      company,
      role,
      contact: form.contact.trim() || "—",
    };
    setSaving(true);
    try {
      const response = await fetch(editing ? `/api/applications/${editing.id}` : "/api/applications", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setNotice(await responseError(response, "The application could not be saved."));
        return;
      }
      const saved = (await response.json()) as ApplicationRecord;
      const savedApplication = decorateApplication(
        saved,
        editing ? applications.findIndex((item) => item.id === editing.id) : 0,
      );
      if (editing) savedApplication.color = editing.color;
      setApplications((current) =>
        editing
          ? current.map((application) => (application.id === editing.id ? savedApplication : application))
          : [savedApplication, ...current],
      );
      setModalOpen(false);
      setNotice(editing ? "Application updated." : "Application added.");
      window.setTimeout(() => setNotice(""), 2800);
    } catch {
      console.error("Unable to save this user's application.");
      setNotice("The application could not be saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function removeApplication(application: Application) {
    if (!window.confirm(`Remove your ${application.role} application at ${application.company}?`)) {
      return;
    }
    try {
      const response = await fetch(`/api/applications/${application.id}`, { method: "DELETE" });
      if (!response.ok) {
        setNotice(await responseError(response, "The application could not be removed."));
        return;
      }
      setApplications((current) => current.filter((item) => item.id !== application.id));
      setNotice("Application removed.");
      window.setTimeout(() => setNotice(""), 2800);
    } catch {
      console.error("Unable to delete this user's application.");
      setNotice("The application could not be removed. Check your connection and try again.");
    }
  }

  async function updateStage(application: Application, stage: Stage) {
    try {
      const response = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...application, stage }),
      });
      if (!response.ok) {
        setNotice(await responseError(response, "The application stage could not be updated."));
        return;
      }
      setApplications((current) =>
        current.map((item) => (item.id === application.id ? { ...item, stage } : item)),
      );
    } catch {
      console.error("Unable to update this user's application stage.");
      setNotice("The application stage could not be updated. Check your connection and try again.");
    }
  }

  async function signOut() {
    try {
      const result = await authClient.signOut();
      if (result.error) setNotice("You could not be signed out. Please try again.");
    } catch {
      console.error("Unable to end the current session.");
      setNotice("You could not be signed out. Please try again.");
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Daymark home">
          <span className="brand-mark"><Sparkles size={17} strokeWidth={2.3} /></span>
          <span>daymark<span className="brand-period">.</span></span>
        </a>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <button
            className={`nav-item ${activeView === "Overview" ? "nav-active" : ""}`}
            onClick={() => { setActiveView("Overview"); setActiveStage("All"); }}
          >
            <LayoutDashboard size={17} /> Overview
          </button>
          <button
            className={`nav-item ${activeView === "Applications" ? "nav-active" : ""}`}
            onClick={() => setActiveView("Applications")}
          >
            <BriefcaseBusiness size={17} /> Applications
            <span className="nav-count">{applications.length}</span>
          </button>
        </nav>

        <div className="sidebar-spacer" />
        <div className="sidebar-tip">
          <span className="tip-icon"><Sparkles size={15} /></span>
          <strong>Little by little.</strong>
          <p>Every application is a step closer to your next chapter.</p>
        </div>
        <button className="profile-button" type="button" onClick={() => void signOut()} title="Sign out">
          <span className="profile-avatar">{makeInitials(user.name || user.email).slice(0, 2)}</span>
          <span className="profile-copy"><strong>{user.name || "Your workspace"}</strong><small>{user.email}</small></span>
          <MoreHorizontal size={19} className="profile-more" />
        </button>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{activeView}</strong></div>
          <div className="topbar-actions">
            <span className="local-indicator"><span /> Private workspace</span>
            <button className="icon-button help-button" aria-label="Account data information" title="Your applications are scoped to your account">
              <CircleHelp size={18} />
            </button>
            <button className="icon-button" aria-label="Notifications"><Bell size={18} /><i /></button>
            <button className="top-avatar top-avatar-button" type="button" onClick={() => void signOut()} aria-label="Sign out" title={`Sign out ${user.email}`}>
              {makeInitials(user.name || user.email).slice(0, 2)}
            </button>
          </div>
        </header>

        <div className="page-content">
          <div className="greeting-row">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT CHAPTER STARTS HERE</div>
              <h1>{activeView === "Overview" ? "Keep your momentum." : "All applications."}</h1>
              <p className="page-subtitle">
                {activeView === "Overview"
                  ? "A little progress, every day. Here's where things stand."
                  : "Every opportunity, conversation, and next step in one place."}
              </p>
            </div>
            <button className="primary-button" onClick={openNewApplication}><Plus size={17} /> Add application</button>
          </div>

          <div className="stats-grid">
            <article className="stat-card stat-total">
              <div className="stat-top"><span className="stat-label">Total applications</span><span className="stat-icon total-icon"><BriefcaseBusiness size={17} /></span></div>
              <div className="stat-value">{applications.length.toString().padStart(2, "0")}</div>
              <div className="stat-foot"><span className="foot-dot dot-violet" /> Opportunities you&apos;re pursuing</div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span className="stat-label">In progress</span><span className="stat-icon progress-icon"><Clock3 size={17} /></span></div>
              <div className="stat-value">{(counts.Applied + counts.Interview).toString().padStart(2, "0")}</div>
              <div className="stat-foot"><span className="foot-dot dot-amber" /> {counts.Interview} at interview stage</div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span className="stat-label">Offers received</span><span className="stat-icon offer-icon"><Sparkles size={17} /></span></div>
              <div className="stat-value">{counts.Offer.toString().padStart(2, "0")}</div>
              <div className="stat-foot"><span className="foot-dot dot-green" /> Good things are happening</div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span className="stat-label">Response rate</span><span className="stat-icon response-icon"><ArrowUpRight size={17} /></span></div>
              <div className="stat-value">{applications.length ? Math.round(((counts.Interview + counts.Offer + counts.Rejected) / applications.length) * 100) : 0}<span className="stat-percent">%</span></div>
              <div className="stat-foot"><span className="foot-dot dot-blue" /> Applications with a response</div>
            </article>
          </div>

          <div className="content-grid">
            <section className="applications-panel">
              <div className="section-heading">
                <div>
                  <div className="section-title-row"><h2>{activeView === "Overview" ? "Recent applications" : "Your applications"}</h2><span className="section-count">{filteredApplications.length}</span></div>
                  <p className="section-caption">Keep every opportunity moving forward.</p>
                </div>
                <button className="text-button" onClick={() => { setActiveView("Applications"); setActiveStage("All"); }}>View all <ArrowUpRight size={15} /></button>
              </div>

              <div className="toolbar">
                <label className="search-box">
                  <Search size={16} />
                  <input aria-label="Search applications" placeholder="Search company, role, contact..." value={query} onChange={(event) => setQuery(event.target.value)} />
                  {query && <button aria-label="Clear search" className="clear-search" onClick={() => setQuery("")}><X size={14} /></button>}
                </label>
                <label className="filter-select"><Filter size={14} /><select aria-label="Filter by stage" value={activeStage} onChange={(event) => setActiveStage(event.target.value as "All" | Stage)}><option value="All">All stages</option>{stages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</select><ChevronDown size={14} /></label>
                <button className="sort-button" onClick={() => setOldestFirst((current) => !current)} title={oldestFirst ? "Show newest applications first" : "Show oldest applications first"} aria-label="Change application sort order"><ArrowDownUp size={16} /></button>
              </div>

              <div className="application-list">
                {loadingApplications ? (
                  <div className="loading-applications"><span className="loading-spinner" />Loading your private applications…</div>
                ) : filteredApplications.length ? filteredApplications.slice(0, activeView === "Overview" ? 5 : undefined).map((application) => (
                  <article className="application-row" key={application.id}>
                    <div className={`company-mark logo-${application.color}`}>{application.initials}</div>
                    <div className="application-main">
                      <div className="company-and-stage">
                        <h3>{application.company}</h3>
                        <span className={`stage-pill ${stageClass[application.stage]}`}><span />{application.stage}</span>
                      </div>
                      <p className="role-line">{application.role}<span className="role-separator">·</span><MapPin size={13} />{application.location || "Location not set"}</p>
                      <div className="application-meta">
                        <span><CalendarDays size={13} /> Applied {formatDate(application.appliedAt)}</span>
                        <span className="meta-contact">{application.contact !== "—" ? `↳ ${application.contact}` : "No contact yet"}</span>
                      </div>
                    </div>
                    <div className="row-next-step">
                      <span className="next-label">NEXT STEP</span>
                      <strong>{application.nextStep || "Add a next step"}</strong>
                      {application.nextStepDate && <span className="next-date">{formatDate(application.nextStepDate)}</span>}
                    </div>
                    <div className="row-actions">
                      <select className={`row-stage-select ${stageClass[application.stage]}`} aria-label={`Change ${application.company} stage`} value={application.stage} onChange={(event) => updateStage(application, event.target.value as Stage)}><option value="Applied">Applied</option><option value="Interview">Interview</option><option value="Offer">Offer</option><option value="Rejected">Rejected</option><option value="Saved">Saved</option></select>
                      <button className="row-edit" onClick={() => openEditApplication(application)}>Edit</button>
                      <button className="row-more" aria-label={`More options for ${application.company}`} onClick={() => openEditApplication(application)}><MoreHorizontal size={19} /></button>
                    </div>
                  </article>
                )) : (
                  <div className="empty-state">
                    <span className="empty-icon"><Search size={21} /></span>
                    <strong>No applications found</strong>
                    <p>Try a different search, or add a new opportunity.</p>
                    <button className="text-button" onClick={openNewApplication}><Plus size={15} /> Add application</button>
                  </div>
                )}
              </div>
              {activeView === "Overview" && filteredApplications.length > 5 && (
                <button className="list-footer" onClick={() => setActiveView("Applications")}>See all {filteredApplications.length} applications <ArrowUpRight size={15} /></button>
              )}
            </section>

            <aside className="right-column">
              <section className="pipeline-card">
                <div className="section-heading compact-heading"><div><h2>Your pipeline</h2><p className="section-caption">A snapshot of your journey.</p></div><button className="icon-button subtle-icon" aria-label="Pipeline summary"><Settings2 size={16} /></button></div>
                <div className="pipeline-total"><strong>{applications.length}</strong><span>active opportunities</span></div>
                <div className="pipeline-bar" aria-label="Application stages">
                  {stages.map((stage) => <span key={stage} className={`pipeline-segment ${stageClass[stage]}`} style={{ width: `${applications.length ? Math.max((counts[stage] / applications.length) * 100, counts[stage] ? 3 : 0) : 0}%` }} />)}
                </div>
                <div className="pipeline-legend">
                  {stages.map((stage) => <button key={stage} onClick={() => { setActiveView("Applications"); setActiveStage(stage); }}><span className={`legend-dot ${stageClass[stage]}`} /><span>{stage}</span><strong>{counts[stage]}</strong></button>)}
                </div>
              </section>

              <section className="upcoming-card">
                <div className="section-heading compact-heading"><div><h2>Coming up</h2><p className="section-caption">A few dates to keep in mind.</p></div><CalendarDays size={17} className="upcoming-heading-icon" /></div>
                {upcoming.length ? <div className="upcoming-list">{upcoming.map((application) => (
                  <button className="upcoming-item" key={application.id} onClick={() => openEditApplication(application)}>
                    <span className="upcoming-date"><strong>{new Date(`${application.nextStepDate}T12:00:00`).getDate().toString().padStart(2, "0")}</strong><small>{new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(`${application.nextStepDate}T12:00:00`))}</small></span>
                    <span className="upcoming-copy"><strong>{application.nextStep || "Next step"}</strong><small>{application.company}{application.contact !== "—" ? ` · ${application.contact}` : ""}</small></span>
                    <ArrowUpRight size={15} className="upcoming-arrow" />
                  </button>
                ))}</div> : <div className="upcoming-empty">Add a next-step date to see reminders here.</div>}
              </section>

              <section className="nudge-card">
                <span className="nudge-sparkle"><Sparkles size={17} /></span>
                <div><strong>One step at a time</strong><p>Small follow-ups can make a big difference. Keep your next steps up to date.</p></div>
              </section>
            </aside>
          </div>
          <footer className="page-footer"><span>Made for the in-between.</span><span><span className="footer-dot" /> Private to {user.email}</span></footer>
        </div>
      </section>

      {notice && <div className="toast" role="status"><Check size={16} />{notice}</div>}

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <section className="application-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-header"><div><span className="modal-eyebrow">{editing ? "KEEP IT UP TO DATE" : "A NEW OPPORTUNITY"}</span><h2 id="modal-title">{editing ? "Edit application" : "Add an application"}</h2><p>Capture the details now. You can always update them later.</p></div><button className="modal-close" aria-label="Close dialog" onClick={() => setModalOpen(false)}><X size={19} /></button></div>
            <form onSubmit={saveApplication}>
              <div className="form-grid">
                <label className="form-field"><span>Company <i>*</i></span><input autoFocus required value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} placeholder="e.g. Acme Inc." /></label>
                <label className="form-field"><span>Role <i>*</i></span><input required value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} placeholder="e.g. Product Designer" /></label>
                <label className="form-field"><span>Location</span><input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Remote, New York..." /></label>
                <label className="form-field"><span>Stage</span><select value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value as Stage })}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></label>
                <label className="form-field"><span>Date applied</span><input type="date" value={form.appliedAt} onChange={(event) => setForm({ ...form, appliedAt: event.target.value })} /></label>
                <label className="form-field"><span>Found through</span><input value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} placeholder="LinkedIn, referral..." /></label>
                <div className="form-divider"><span>YOUR CONTACT</span></div>
                <label className="form-field"><span>Contact name</span><input value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} placeholder="Recruiter or hiring manager" /></label>
                <label className="form-field"><span>Contact title</span><input value={form.contactTitle} onChange={(event) => setForm({ ...form, contactTitle: event.target.value })} placeholder="e.g. Talent Partner" /></label>
                <label className="form-field full-field"><span>Contact email</span><input type="email" value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} placeholder="name@company.com" /></label>
                <div className="form-divider"><span>WHAT&apos;S NEXT?</span></div>
                <label className="form-field"><span>Next step</span><input value={form.nextStep} onChange={(event) => setForm({ ...form, nextStep: event.target.value })} placeholder="e.g. Follow up with recruiter" /></label>
                <label className="form-field"><span>Reminder date</span><input type="date" value={form.nextStepDate} onChange={(event) => setForm({ ...form, nextStepDate: event.target.value })} /></label>
                <label className="form-field full-field"><span>Notes</span><textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Interview notes, things to remember..." /></label>
              </div>
              <div className="modal-footer">{editing && <button type="button" className="delete-button" disabled={saving} onClick={() => { setModalOpen(false); void removeApplication(editing); }}>Delete</button>}<button type="button" className="cancel-button" disabled={saving} onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={saving}><Check size={16} />{saving ? "Saving…" : editing ? "Save changes" : "Add application"}</button></div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default function Home() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <main className="auth-loading"><span className="brand-mark"><Sparkles size={17} /></span><span>Preparing your private workspace…</span></main>;
  }

  if (!session) return <AuthScreen />;
  return <Dashboard user={{ name: session.user.name, email: session.user.email }} />;
}
