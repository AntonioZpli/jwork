'use client'

import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleUserRound,
  ClipboardList,
  FileText,
  Heart,
  LayoutDashboard,
  Eye,
  Pencil,
  MapPin,
  Menu,
  Moon,
  MoreHorizontal,
  Search,
  Settings2,
  Sun,
  UsersRound,
  X,
} from 'lucide-react'

type Role = 'candidate' | 'company'
type CandidateView = 'Resumen' | 'Explorar empleos' | 'Mis postulaciones' | 'Empleos guardados' | 'Mi perfil'
type CompanyView = 'Resumen' | 'Vacantes' | 'Candidatos' | 'Perfil de empresa'

const candidateNav: { label: CandidateView; icon: typeof LayoutDashboard }[] = [
  { label: 'Resumen', icon: LayoutDashboard },
  { label: 'Explorar empleos', icon: Search },
  { label: 'Mis postulaciones', icon: ClipboardList },
  { label: 'Empleos guardados', icon: Heart },
  { label: 'Mi perfil', icon: CircleUserRound },
]
const companyNav: { label: CompanyView; icon: typeof LayoutDashboard }[] = [
  { label: 'Resumen', icon: LayoutDashboard },
  { label: 'Vacantes', icon: BriefcaseBusiness },
  { label: 'Candidatos', icon: UsersRound },
  { label: 'Perfil de empresa', icon: Building2 },
]

const jobs = [
  { title: 'Diseñador/a de producto digital', company: 'Marea Studio', place: 'Managua · Híbrido', type: 'Contrato indefinido', salary: 'C$ 35,000 – 45,000', date: 'Publicado hace 2 días' },
  { title: 'Especialista de atención al cliente', company: 'Grupo Lumen', place: 'León · Presencial', type: 'Tiempo completo', salary: 'C$ 18,000 – 24,000', date: 'Publicado hace 4 días' },
  { title: 'Desarrollador/a frontend', company: 'NicaTech', place: 'Remoto · Nicaragua', type: 'Contrato indefinido', salary: 'Salario no indicado', date: 'Publicado hace 6 días' },
]
const applications = [
  { title: 'Diseñador/a de producto digital', company: 'Marea Studio', date: '12 oct 2026', status: 'En revisión' },
  { title: 'Diseñador UX/UI', company: 'Crecimiento & Co.', date: '08 oct 2026', status: 'Entrevista' },
  { title: 'Diseñador visual', company: 'Taller Norte', date: '28 sep 2026', status: 'Recibida' },
]

function Status({ children }: { children: string }) {
  const tone = children === 'Entrevista' ? 'status status-warm' : children === 'En revisión' ? 'status status-accent' : 'status'
  return <span className={tone}><span className="status-dot" />{children}</span>
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><div className="empty-icon"><FileText size={18} /></div><strong>{title}</strong><p>{text}</p></div>
}

export default function Page() {
  const [role, setRole] = useState<Role>('candidate')
  const [candidateView, setCandidateView] = useState<CandidateView>('Resumen')
  const [companyView, setCompanyView] = useState<CompanyView>('Resumen')
  const [dark, setDark] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [query, setQuery] = useState('')
  const view = role === 'candidate' ? candidateView : companyView
  const nav = role === 'candidate' ? candidateNav : companyNav
  const filteredJobs = useMemo(() => jobs.filter((job) => `${job.title} ${job.company}`.toLowerCase().includes(query.toLowerCase())), [query])

  const selectView = (label: string) => {
    if (role === 'candidate') setCandidateView(label as CandidateView)
    else setCompanyView(label as CompanyView)
    setMobileNav(false)
  }

  return <div className={`${dark ? 'app-shell dark-mode' : 'app-shell'}${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
    <aside className={`${mobileNav ? 'sidebar sidebar-open' : 'sidebar'}${sidebarCollapsed ? ' sidebar-is-collapsed' : ''}`}>
      <div className="brand"><span className="brand-mark">j</span><span className="brand-name">jinowork</span><button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} aria-label={sidebarCollapsed ? 'Mostrar menú' : 'Ocultar menú'} title={sidebarCollapsed ? 'Mostrar menú' : 'Ocultar menú'}><ChevronDown size={15} /></button></div>
      <div className="role-switch" role="tablist" aria-label="Tipo de cuenta">
        <button className={role === 'candidate' ? 'role-active' : ''} onClick={() => { setRole('candidate'); setCandidateView('Resumen') }}>Candidato</button>
        <button className={role === 'company' ? 'role-active' : ''} onClick={() => { setRole('company'); setCompanyView('Resumen') }}>Empresa</button>
      </div>
      <div className="nav-label">Espacio de trabajo</div>
      <nav>{nav.map(({ label, icon: Icon }) => <button key={label} className={view === label ? 'nav-item nav-active' : 'nav-item'} onClick={() => selectView(label)}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{view === label && <span className="nav-line" />}</button>)}</nav>
      <div className="sidebar-bottom"><button className="nav-item"><Settings2 size={17} /><span>Configuración</span></button><div className="user-mini"><CandidatePhoto /><div><strong>{role === 'candidate' ? 'Carla Méndez' : 'Marea Studio'}</strong><small>{role === 'candidate' ? 'Candidato' : 'Empresa'}</small></div><MoreHorizontal size={16} /></div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="desktop-menu icon-button" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} aria-label={sidebarCollapsed ? 'Mostrar menú' : 'Ocultar menú'} title={sidebarCollapsed ? 'Mostrar menú' : 'Ocultar menú'}><Menu size={18} /></button><button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Abrir navegación"><Menu size={20} /></button><div><span className="eyebrow">{role === 'candidate' ? 'Espacio del candidato' : 'Espacio de empresa'}</span><h1>{view}</h1></div><div className="top-actions"><button className="icon-button" onClick={() => setDark(!dark)} aria-label="Cambiar tema">{dark ? <Sun size={18} /> : <Moon size={18} />}</button><button className="icon-button notification" aria-label="Notificaciones"><Bell size={18} /><i /></button>{role === 'candidate' ? <CandidatePhoto className="avatar-top" /> : <CompanyPhoto className="company-photo-top" />}</div></header>
      <div className="content">
        {role === 'candidate' && view === 'Resumen' && <CandidateDashboard onNavigate={selectView} />}
        {role === 'candidate' && view === 'Explorar empleos' && <ExploreJobs query={query} setQuery={setQuery} jobs={filteredJobs} />}
        {role === 'candidate' && view === 'Mis postulaciones' && <Applications />}
        {role === 'candidate' && view === 'Empleos guardados' && <EmptyState title="Aún no tienes empleos guardados" text="Guarda las vacantes que quieras revisar más tarde y las encontrarás aquí." />}
        {role === 'candidate' && view === 'Mi perfil' && <Profile />}
        {role === 'company' && view === 'Resumen' && <CompanyDashboard onNavigate={selectView} />}
        {role === 'company' && view === 'Vacantes' && <CompanyJobs />}
        {role === 'company' && view === 'Candidatos' && <Candidates />}
        {role === 'company' && view === 'Perfil de empresa' && <CompanyProfile />}
      </div>
    </main>
  </div>
}

function CandidatePhoto({ className = '' }: { className?: string }) { return <img className={`candidate-photo ${className}`} src="/carla-mendez.png" alt="Carla Méndez" /> }
function CompanyPhoto({ className = '' }: { className?: string }) { return <img className={`company-photo ${className}`} src="/marea-studio.png" alt="Marea Studio" /> }
function PageHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) { return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{children}</div> }
function CandidateDashboard({ onNavigate }: { onNavigate: (label: string) => void }) { return <><PageHeading eyebrow="Lunes, 26 de octubre" title="Buen día, Carla."><button className="text-action" onClick={() => onNavigate('Mi perfil')}>Completar perfil <ArrowUpRight size={15} /></button></PageHeading><section className="stats-grid"><div className="stat"><span>Postulaciones enviadas</span><strong>8</strong><small>+2 esta semana</small></div><div className="stat"><span>En revisión</span><strong>3</strong><small className="muted">Sin cambios nuevos</small></div><div className="stat"><span>Procesos avanzados</span><strong>1</strong><small>Entrevista esta semana</small></div><div className="stat"><span>Empleos guardados</span><strong>12</strong><small className="muted">4 nuevos desde ayer</small></div></section><div className="dashboard-grid"><section className="panel activity-panel"><div className="panel-head"><div><span className="eyebrow">Seguimiento</span><h3>Actividad reciente</h3></div><button className="link-button" onClick={() => onNavigate('Mis postulaciones')}>Ver todas</button></div>{applications.map((item, i) => <div className="activity-row" key={item.title}><div className="timeline"><span className={i === 1 ? 'timeline-dot timeline-current' : 'timeline-dot'} />{i < applications.length - 1 && <span className="timeline-line" />}</div><div className="activity-copy"><strong>{item.title}</strong><span>{item.company} · {item.date}</span></div><Status>{item.status}</Status></div>)}</section><section className="panel profile-progress"><div className="panel-head"><div><span className="eyebrow">Tu perfil</span><h3>Hazte visible</h3></div><span className="progress-number">72%</span></div><div className="progress-track"><span /></div><p>Un perfil completo recibe más visitas de empresas.</p><button className="outline-button" onClick={() => onNavigate('Mi perfil')}>Revisar perfil</button></section></div><section className="panel jobs-panel"><div className="panel-head"><div><span className="eyebrow">Para ti</span><h3>Vacantes recientes</h3></div><button className="link-button" onClick={() => onNavigate('Explorar empleos')}>Explorar empleos</button></div><div className="job-list">{jobs.map((job) => <JobRow key={job.title} job={job} />)}</div></section></> }
function JobRow({ job }: { job: typeof jobs[number] }) { return <div className="job-row"><div className="company-mark">{job.company.slice(0, 1)}</div><div className="job-main"><strong>{job.title}</strong><span>{job.company}</span></div><div className="job-meta"><span><MapPin size={14} />{job.place}</span><span>{job.type}</span></div><div className="job-salary">{job.salary}<small>{job.date}</small></div><button className="row-action" aria-label={`Guardar ${job.title}`}><Heart size={17} /></button></div> }
function ExploreJobs({ query, setQuery, jobs }: { query: string; setQuery: (v: string) => void; jobs: typeof jobs }) { return <><PageHeading eyebrow="Oportunidades para ti" title="Explorar empleos"><button className="outline-button"><Settings2 size={15} /> Mis filtros</button></PageHeading><div className="search-bar"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Título, empresa o palabra clave" /><button className="search-submit">Buscar</button></div><div className="filter-line"><button className="filter-select">Todos los departamentos <ChevronDown size={15} /></button><button className="filter-select">Modalidad <ChevronDown size={15} /></button><button className="filter-select">Tipo de contrato <ChevronDown size={15} /></button><span className="result-count">{jobs.length} resultados</span></div><section className="panel jobs-panel"><div className="panel-head"><h3>Vacantes que coinciden</h3><button className="sort-button">Más recientes <ChevronDown size={15} /></button></div><div className="job-list">{jobs.map((job) => <JobRow key={job.title} job={job} />)}</div></section></> }
function Applications() { return <><PageHeading eyebrow="Tu búsqueda en movimiento" title="Mis postulaciones"><button className="outline-button">Filtrar <ChevronDown size={15} /></button></PageHeading><section className="panel table-panel"><div className="table-toolbar"><div className="tabs"><button className="tab-active">Todas <span>8</span></button><button>En revisión <span>3</span></button><button>Entrevistas <span>1</span></button></div><button className="icon-button"><Search size={17} /></button></div><div className="table-scroll"><table><thead><tr><th>Vacante</th><th>Empresa</th><th>Fecha</th><th>Estado</th><th /></tr></thead><tbody>{applications.map((app) => <tr key={app.title}><td><strong>{app.title}</strong></td><td>{app.company}</td><td>{app.date}</td><td><Status>{app.status}</Status></td><td><button className="row-action"><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div></section></> }
function Profile() {
  const [preview, setPreview] = useState(false)
  return <>
    <PageHeading eyebrow="Perfil profesional" title={preview ? 'Así te ven las empresas' : 'Mi perfil'}>
      <div className="profile-actions">
        <button className={preview ? 'profile-switch active' : 'profile-switch'} onClick={() => setPreview(!preview)}><Eye size={16} /> {preview ? 'Volver a editar' : 'Vista pública'}</button>
        {!preview && <button className="primary-button"><Check size={15} /> Guardar cambios</button>}
      </div>
    </PageHeading>
    {preview ? <section className="public-profile panel"><div className="public-profile-cover"><span>Perfil público</span><span>Visible para empresas</span></div><div className="public-profile-body"><CandidatePhoto className="profile-avatar large" /><div className="public-profile-intro"><span className="eyebrow">Diseño · Producto digital</span><h3>Carla Méndez</h3><p>Diseñadora enfocada en crear productos digitales claros, útiles y accesibles.</p><div className="profile-tags"><span>Diseño de producto</span><span>UX/UI</span><span>Managua, Nicaragua</span></div></div><button className="profile-edit-float" onClick={() => setPreview(false)}><Pencil size={15} /> Editar perfil</button></div><div className="public-profile-grid"><div><span className="eyebrow">Sobre mí</span><p>Me interesa transformar necesidades complejas en experiencias simples, con criterio visual y atención al detalle.</p></div><div><span className="eyebrow">Disponibilidad</span><strong>Abierta a oportunidades</strong><small>Tiempo completo · Híbrido o remoto</small></div></div></section> : <section className="profile-layout"><div className="panel profile-card"><CandidatePhoto className="profile-avatar" /><h3>Carla Méndez</h3><p>Diseñadora de producto digital</p><button className="outline-button"><Pencil size={15} /> Cambiar foto</button><div className="profile-contact"><span>carla.mendez@email.com</span><span>Managua, Nicaragua</span></div><button className="profile-preview-link" onClick={() => setPreview(true)}><Eye size={15} /> Ver como empresa</button></div><div className="profile-form"><FormSection title="Información personal"><div className="form-grid"><label>Nombre y apellidos<input defaultValue="Carla Méndez" /></label><label>Correo de contacto<input defaultValue="carla.mendez@email.com" /></label><label>Teléfono<input placeholder="+505 0000 0000" /></label><label>Municipio<input defaultValue="Managua" /></label></div></FormSection><FormSection title="Perfil profesional"><div className="form-grid"><label>Área profesional<select defaultValue="Diseño"><option>Diseño</option><option>Tecnología</option></select></label><label>Especialidad<input defaultValue="Producto digital" /></label></div><label>Resumen profesional<textarea defaultValue="Diseñadora enfocada en crear productos digitales claros, útiles y accesibles." /></label></FormSection></div></section>}
  </>
}
function FormSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="form-section"><div className="form-section-head"><h3>{title}</h3><button className="link-button">Editar</button></div>{children}</section> }
function CompanyDashboard({ onNavigate }: { onNavigate: (label: string) => void }) { return <><PageHeading eyebrow="Panel de empresa" title="Resumen de Marea Studio"><span className="verified"><Check size={14} /> Empresa verificada</span></PageHeading><section className="stats-grid"><div className="stat"><span>Vacantes publicadas</span><strong>4</strong><small>2 reciben postulaciones</small></div><div className="stat"><span>En borrador</span><strong>2</strong><small className="muted">Listas para revisar</small></div><div className="stat"><span>Postulaciones recibidas</span><strong>36</strong><small>+8 esta semana</small></div><div className="stat"><span>Pendientes de revisar</span><strong>14</strong><small className="muted">Requieren atención</small></div></section><div className="dashboard-grid"><section className="panel activity-panel"><div className="panel-head"><div><span className="eyebrow">Hoy</span><h3>Actividad reciente</h3></div><button className="link-button" onClick={() => onNavigate('Candidatos')}>Ver candidatos</button></div><div className="activity-row"><div className="company-mark small-mark">N</div><div className="activity-copy"><strong>Nueva postulación recibida</strong><span>Diseñador/a de producto digital · hace 24 min</span></div><button className="row-action"><ArrowUpRight size={17} /></button></div><div className="activity-row"><div className="company-mark small-mark">J</div><div className="activity-copy"><strong>Vacante actualizada</strong><span>Desarrollador/a frontend · hace 2 h</span></div><button className="row-action"><ArrowUpRight size={17} /></button></div></section><section className="panel profile-progress"><div className="panel-head"><div><span className="eyebrow">Tu empresa</span><h3>Perfil completo</h3></div><span className="progress-number">88%</span></div><div className="progress-track"><span className="progress-high" /></div><p>Completa la información para transmitir más confianza.</p><button className="outline-button" onClick={() => onNavigate('Perfil de empresa')}>Revisar perfil</button></section></div><section className="panel table-panel"><div className="panel-head"><div><span className="eyebrow">Rendimiento</span><h3>Postulaciones por vacante</h3></div><button className="link-button" onClick={() => onNavigate('Vacantes')}>Administrar vacantes</button></div><div className="bar-list"><div><span>Diseñador/a de producto digital</span><strong>18</strong><i><em style={{ width: '78%' }} /></i></div><div><span>Desarrollador/a frontend</span><strong>9</strong><i><em style={{ width: '45%' }} /></i></div><div><span>Content manager</span><strong>6</strong><i><em style={{ width: '30%' }} /></i></div></div></section></> }
function CompanyJobs() { return <><PageHeading eyebrow="Operación" title="Vacantes"><button className="primary-button"><span>+</span> Nueva vacante</button></PageHeading><div className="filter-line"><div className="search-inline"><Search size={16} /><input placeholder="Buscar por título" /></div><button className="filter-select">Todos los estados <ChevronDown size={15} /></button><span className="result-count">6 vacantes</span></div><section className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Vacante</th><th>Publicación</th><th>Estado</th><th>Postulaciones</th><th>Vencimiento</th><th /></tr></thead><tbody>{[['Diseñador/a de producto digital','20 oct 2026','Publicada','18','20 nov 2026'],['Desarrollador/a frontend','14 oct 2026','Publicada','9','14 nov 2026'],['Content manager','02 oct 2026','Pausada','6','02 nov 2026'],['Community manager','Borrador','Borrador','—','—']].map((row) => <tr key={row[0]}><td><strong>{row[0]}</strong></td><td>{row[1]}</td><td><Status>{row[2]}</Status></td><td>{row[3]}</td><td>{row[4]}</td><td><button className="row-action"><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div></section></> }
function Candidates() { return <><PageHeading eyebrow="Equipo de selección" title="Candidatos"><button className="outline-button">Exportar lista <ArrowUpRight size={15} /></button></PageHeading><div className="filter-line"><div className="search-inline"><Search size={16} /><input placeholder="Buscar candidato o vacante" /></div><button className="filter-select">Todas las vacantes <ChevronDown size={15} /></button><button className="filter-select">Todos los estados <ChevronDown size={15} /></button></div><section className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Candidato</th><th>Vacante</th><th>Postulación</th><th>Estado</th><th /></tr></thead><tbody>{[['María José López','Diseñador/a de producto digital','24 oct 2026','En revisión'],['Andrés Castillo','Desarrollador/a frontend','23 oct 2026','Preseleccionado'],['Lucía Gutiérrez','Content manager','21 oct 2026','Entrevista']].map((row) => <tr key={row[0]}><td><div className="candidate-cell"><div className="avatar">{row[0].split(' ').map((x) => x[0]).join('').slice(0, 2)}</div><strong>{row[0]}</strong></div></td><td>{row[1]}</td><td>{row[2]}</td><td><Status>{row[3]}</Status></td><td><button className="row-action"><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div></section></> }
function CompanyProfile() {
  const [preview, setPreview] = useState(false)
  return <>
    <PageHeading eyebrow="Identidad de la empresa" title={preview ? 'Así te ven los candidatos' : 'Perfil de empresa'}>
      <div className="profile-actions">
        <button className={preview ? 'profile-switch active' : 'profile-switch'} onClick={() => setPreview(!preview)}><Eye size={16} /> {preview ? 'Volver a editar' : 'Vista pública'}</button>
        {!preview && <button className="primary-button"><Check size={15} /> Guardar cambios</button>}
      </div>
    </PageHeading>
    {preview ? <section className="public-profile panel company-public-profile">
      <div className="public-profile-cover company-cover"><span>Perfil público</span><span>Visible para candidatos</span></div>
      <div className="public-profile-body company-public-body"><CompanyPhoto className="company-logo-large" /><div className="public-profile-intro"><div className="verified"><Check size={14} /> Empresa verificada</div><h3>Marea Studio</h3><p>Estudio de diseño digital que ayuda a organizaciones nicaragüenses a crear productos más claros y humanos.</p><div className="profile-tags"><span>Diseño y tecnología</span><span>Managua, Nicaragua</span><span>11–50 personas</span></div></div><button className="profile-edit-float" onClick={() => setPreview(false)}><Pencil size={15} /> Editar perfil</button></div>
      <div className="public-profile-grid company-public-grid"><div><span className="eyebrow">Sobre la empresa</span><p>Trabajamos con equipos que quieren convertir ideas complejas en experiencias digitales útiles, accesibles y memorables.</p></div><div><span className="eyebrow">Información</span><strong>mareastudio.com</strong><small>hola@mareastudio.com</small><small>Managua · Nicaragua</small></div></div>
      <div className="company-public-footer"><span>4 vacantes activas</span><button className="outline-button">Ver vacantes <ArrowUpRight size={15} /></button></div>
    </section> : <section className="company-profile-layout"><div className="panel company-identity-card"><CompanyPhoto className="company-logo-large" /><span className="verified"><Check size={14} /> Verificada por Jinowork</span><h3>Marea Studio</h3><p>Diseño y tecnología</p><div className="company-card-meta"><span><MapPin size={14} /> Managua, Nicaragua</span><span><UsersRound size={14} /> 11–50 personas</span></div><button className="profile-preview-link" onClick={() => setPreview(true)}><Eye size={15} /> Ver como candidato</button></div><section className="panel company-form"><FormSection title="Información general"><div className="form-grid"><label>Nombre comercial<input defaultValue="Marea Studio" /></label><label>Sector<select defaultValue="Diseño y tecnología"><option>Diseño y tecnología</option><option>Servicios profesionales</option></select></label><label>Sitio web<input defaultValue="https://mareastudio.com" /></label><label>Correo de contacto<input defaultValue="hola@mareastudio.com" /></label></div><label>Descripción<textarea defaultValue="Estudio de diseño digital que ayuda a organizaciones nicaragüenses a crear productos más claros y humanos." /></label></FormSection><FormSection title="Ubicación"><div className="form-grid"><label>Departamento<select defaultValue="Managua"><option>Managua</option><option>León</option><option>Granada</option></select></label><label>Municipio<select defaultValue="Managua"><option>Managua</option><option>Ciudad Sandino</option><option>Tipitapa</option></select></label><label>Dirección<input placeholder="Dirección de la empresa" /></label><label>Teléfono<input placeholder="+505 0000 0000" /></label></div></FormSection><FormSection title="Identificación y verificación"><div className="form-grid"><label>Identificación fiscal<input placeholder="RUC de la empresa" /></label><label>Estado de verificación<div className="readonly-field"><Check size={15} /> Empresa verificada</div></label></div><p className="form-hint">La información de verificación es de solo lectura y se conserva para proteger la confianza de la comunidad.</p></FormSection></section></section>}
  </>
}
