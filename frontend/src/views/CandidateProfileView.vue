<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, BriefcaseBusiness, Camera, Check, Eye, FileUp, FileUser, GraduationCap, Languages, MapPin, Pencil, Plus, Trash2, UserRound, X } from 'lucide-vue-next'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import { candidateFileUrl, loadCandidatePhoto, profilesApi, type CandidateProfileData, type CandidateProfileOptions } from '@/services/profiles'

type ExperienceForm = { id: string; position: string; company: string; startYear: string; startMonth: string; endYear: string; endMonth: string; description: string }
type EducationForm = { id: string; institution: string; degree: string; startYear: string; startMonth: string; endYear: string; endMonth: string }
const profile = ref<CandidateProfileData | null>(null)
const options = ref<CandidateProfileOptions | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const message = ref('')
const photoPreview = ref('')
const experienceRows = ref<ExperienceForm[]>([])
const educationRows = ref<EducationForm[]>([])
const showExperienceForm = ref(false)
const showEducationForm = ref(false)
const editingExperienceId = ref('')
const editingEducationId = ref('')
const form = reactive({ firstName: '', lastName: '', contactEmail: '', phone: '', departmentId: '', municipalityId: '', professionalAreaId: '', specializationId: '', description: '' })
const newExperience = reactive({ position: '', company: '', startYear: '', startMonth: '', endYear: '', endMonth: '', description: '' })
const newEducation = reactive({ institution: '', degree: '', startYear: '', startMonth: '', endYear: '', endMonth: '' })
const newLanguageId = ref('')
const newLanguageLevel = ref('INTERMEDIATE')
const professionalSummary = computed(() => {
  if (!options.value) return 'Añade tu área y especialidad profesional'
  return [options.value.professionalAreas.find(item => item.id === form.professionalAreaId)?.name, options.value.specializations.find(item => item.id === form.specializationId)?.name].filter(Boolean).join(' · ') || 'Añade tu área y especialidad profesional'
})
const candidateLocation = computed(() => [options.value?.municipalities.find(item => item.id === form.municipalityId)?.name, options.value?.departments.find(item => item.id === form.departmentId)?.name].filter(Boolean).join(', ') || 'Ubicación pendiente')
const municipalities = computed(() => options.value?.municipalities.filter(item => item.departmentId === form.departmentId) ?? [])
const specializations = computed(() => options.value?.specializations.filter(item => item.professionalAreaId === form.professionalAreaId) ?? [])
const languagesNotAdded = computed(() => options.value?.languages.filter(item => !profile.value?.languages.some(saved => saved.language.id === item.id)) ?? [])
function validCandidatePhone(value: string) {
  if (value.length > 40 || !/^[+\d\s().-]+$/.test(value)) return false
  const digits = value.replace(/\D/g, '')
  const national = digits.startsWith('505') && digits.length === 11 ? digits.slice(3) : digits
  return /^[2-9]\d{7}$/.test(national)
}
function validEmail(value: string) { return !value.trim() || (value.trim().length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) }
function validYear(value: string) { const year = Number(value); return /^\d{4}$/.test(value) && year >= 1900 && year <= currentYear }
function validPeriod(startYear: string, startMonth: string, endYear: string, endMonth: string) {
  if (!validYear(startYear) || (startMonth && !months.some(month => month.value === startMonth))) return false
  const today = new Date()
  const startMonthNumber = Number(startMonth || '01')
  if (Number(startYear) > today.getFullYear() || (Number(startYear) === today.getFullYear() && startMonthNumber > today.getMonth() + 1)) return false
  if (endMonth && !endYear) return false
  if (!endYear) return true
  if (!validYear(endYear) || (endMonth && !months.some(month => month.value === endMonth))) return false
  return Number(endYear + (endMonth || '12')) >= Number(startYear + (startMonth || '01'))
}
const completionItems = computed(() => profile.value ? [
  { label: 'Datos personales y ubicación', done: form.firstName.trim().length > 0 && form.lastName.trim().length > 0 && validEmail(form.contactEmail) && validCandidatePhone(form.phone) && options.value?.departments.some(item => item.id === form.departmentId) === true && options.value?.municipalities.some(item => item.id === form.municipalityId && item.departmentId === form.departmentId) === true, target: '#personal' },
  { label: 'Área profesional', done: options.value?.professionalAreas.some(item => item.id === form.professionalAreaId) === true && (!form.specializationId || options.value?.specializations.some(item => item.id === form.specializationId && item.professionalAreaId === form.professionalAreaId) === true), target: '#personal' },
  { label: 'Resumen profesional', done: form.description.trim().length >= 30 && form.description.trim().length <= 5000, target: '#personal' },
  { label: 'Currículum', done: Boolean(profile.value.cvUrl), target: '#files' },
  { label: 'Experiencia', done: experienceRows.value.some(item => item.position.trim() && item.company.trim() && validPeriod(item.startYear, item.startMonth, item.endYear, item.endMonth)), target: '#experience' },
  { label: 'Formación académica', done: educationRows.value.some(item => item.institution.trim() && item.degree.trim() && (!item.startYear && !item.endYear || Boolean(item.startYear && validPeriod(item.startYear, item.startMonth, item.endYear, item.endMonth)))), target: '#education' },
] : [])
const profileCompletion = computed(() => completionItems.value.length ? Math.round(completionItems.value.filter(item => item.done).length / completionItems.value.length * 100) : 0)
const completedProfileItems = computed(() => completionItems.value.filter(item => item.done).length)
const nextProfileStep = computed(() => completionItems.value.find(item => !item.done) ?? null)
const profileStages = computed(() => [
  { title: 'Preséntate', detail: 'Datos, especialidad y resumen', done: completionItems.value.slice(0, 3).every(item => item.done) },
  { title: 'Muestra tu recorrido', detail: 'Currículum, experiencia y estudios', done: completionItems.value.slice(3).every(item => item.done) },
])
const months = [
  { value: '01', label: 'Enero' }, { value: '02', label: 'Febrero' }, { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' }, { value: '05', label: 'Mayo' }, { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' }, { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' },
]
const currentYear = new Date().getFullYear()
function dateFields(value: string | null) {
  if (!value) return { year: '', month: '' }
  const date = new Date(value)
  const year = String(date.getUTCFullYear())
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  // Day 15 in January/December represents a year-only value in the Date column.
  const yearOnly = date.getUTCDate() === 15 && (month === '01' || month === '12')
  return { year, month: yearOnly ? '' : month }
}
function dateRangeFields(start: string | null, end: string | null) {
  const startParts = dateFields(start)
  const endParts = dateFields(end)
  return { startYear: startParts.year, startMonth: startParts.month, endYear: endParts.year, endMonth: endParts.month }
}
function toDate(year: string, month: string, edge: 'start' | 'end') {
  if (!year) return null
  if (month) return `${year}-${month}-01`
  return edge === 'start' ? `${year}-01-15` : `${year}-12-15`
}
function dateLabel(year: string, month: string) {
  if (!year) return ''
  return month ? `${months.find(item => item.value === month)?.label} ${year}` : year
}
function experiencePeriod(item: ExperienceForm) {
  return `${dateLabel(item.startYear, item.startMonth)} – ${dateLabel(item.endYear, item.endMonth) || 'Actualidad'}`
}
function educationPeriod(item: EducationForm) {
  if (!item.startYear && !item.endYear) return 'Periodo sin especificar'
  return `${dateLabel(item.startYear, item.startMonth) || 'Inicio sin especificar'} – ${dateLabel(item.endYear, item.endMonth) || 'En curso'}`
}
async function load() {
  loading.value = true
  try {
    const result = await profilesApi.candidate()
    profile.value = result.profile; options.value = result.catalogs
    if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
    photoPreview.value = result.profile.photoUrl ? await loadCandidatePhoto(result.profile.photoUrl).catch(() => '') : ''
    Object.assign(form, { firstName: result.profile.firstName, lastName: result.profile.lastName, contactEmail: result.profile.contactEmail ?? '', phone: result.profile.phone ?? '', departmentId: result.profile.departmentId ?? '', municipalityId: result.profile.municipalityId ?? '', professionalAreaId: result.profile.professionalAreaId ?? '', specializationId: result.profile.specializationId ?? '', description: result.profile.description ?? '' })
    experienceRows.value = result.profile.experiences.map(item => ({ id: item.id, position: item.position, company: item.company, ...dateRangeFields(item.startDate, item.endDate), description: item.description ?? '' }))
    educationRows.value = result.profile.education.map(item => ({ id: item.id, institution: item.institution, degree: item.degree, ...dateRangeFields(item.startDate, item.endDate) }))
  } catch (e) { error.value = e instanceof Error ? e.message : 'No se pudo cargar tu perfil.' }
  finally { loading.value = false }
}
async function perform(action: () => Promise<unknown>, success: string) {
  if (saving.value) return
  saving.value = true; error.value = ''; message.value = ''
  try { await action(); message.value = success; await load() }
  catch (e) { error.value = e instanceof Error ? e.message : 'No se pudo guardar el cambio.' }
  finally { saving.value = false }
}
function saveProfile() { return perform(() => profilesApi.updateCandidate({ ...form, contactEmail: form.contactEmail || null, departmentId: form.departmentId || null, municipalityId: form.municipalityId || null, professionalAreaId: form.professionalAreaId || null, specializationId: form.specializationId || null }), 'Perfil actualizado.') }
async function addExperience() {
  if ((newExperience.startMonth && !newExperience.startYear) || (newExperience.endMonth && !newExperience.endYear)) { error.value = 'Indica el año para cada mes que selecciones.'; return }
  await perform(() => profilesApi.addExperience({ position: newExperience.position, company: newExperience.company, startDate: toDate(newExperience.startYear, newExperience.startMonth, 'start'), endDate: toDate(newExperience.endYear, newExperience.endMonth, 'end'), description: newExperience.description || null }), 'Experiencia agregada.')
  if (!error.value) { Object.assign(newExperience, { position: '', company: '', startYear: '', startMonth: '', endYear: '', endMonth: '', description: '' }); showExperienceForm.value = false }
}
async function updateExperience(item: ExperienceForm) {
  if ((item.startMonth && !item.startYear) || (item.endMonth && !item.endYear)) { error.value = 'Indica el año para cada mes que selecciones.'; return }
  await perform(() => profilesApi.updateExperience(item.id, { position: item.position, company: item.company, startDate: toDate(item.startYear, item.startMonth, 'start'), endDate: toDate(item.endYear, item.endMonth, 'end'), description: item.description || null }), 'Experiencia actualizada.')
  if (!error.value) editingExperienceId.value = ''
}
function removeExperience(id: string) { return perform(() => profilesApi.deleteExperience(id), 'Experiencia eliminada.') }
async function addEducation() {
  if ((newEducation.startMonth && !newEducation.startYear) || (newEducation.endMonth && !newEducation.endYear)) { error.value = 'Indica el año para cada mes que selecciones.'; return }
  await perform(() => profilesApi.addEducation({ institution: newEducation.institution, degree: newEducation.degree, startDate: toDate(newEducation.startYear, newEducation.startMonth, 'start'), endDate: toDate(newEducation.endYear, newEducation.endMonth, 'end') }), 'Formación agregada.')
  if (!error.value) { Object.assign(newEducation, { institution: '', degree: '', startYear: '', startMonth: '', endYear: '', endMonth: '' }); showEducationForm.value = false }
}
async function updateEducation(item: EducationForm) {
  if ((item.startMonth && !item.startYear) || (item.endMonth && !item.endYear)) { error.value = 'Indica el año para cada mes que selecciones.'; return }
  await perform(() => profilesApi.updateEducation(item.id, { institution: item.institution, degree: item.degree, startDate: toDate(item.startYear, item.startMonth, 'start'), endDate: toDate(item.endYear, item.endMonth, 'end') }), 'Formación actualizada.')
  if (!error.value) editingEducationId.value = ''
}
function removeEducation(id: string) { return perform(() => profilesApi.deleteEducation(id), 'Formación eliminada.') }
function saveLanguage(id: string, level: string) { return perform(() => profilesApi.saveLanguage(id, level), 'Idioma actualizado.') }
function removeLanguage(id: string) { return perform(() => profilesApi.deleteLanguage(id), 'Idioma eliminado.') }
async function upload(kind: 'cv' | 'photo', event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const max = kind === 'cv' ? 5 : 2
  const allowed = kind === 'cv' ? file.type === 'application/pdf' : ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  if (!allowed || file.size > max * 1024 * 1024) { error.value = `Selecciona ${kind === 'cv' ? 'un PDF' : 'una imagen JPG, PNG o WebP'} de máximo ${max} MB.`; return }
  await perform(() => profilesApi.uploadCandidateFile(kind, file), kind === 'cv' ? 'Currículum actualizado.' : 'Foto actualizada.')
}
onMounted(load)
onBeforeUnmount(() => { if (photoPreview.value) URL.revokeObjectURL(photoPreview.value) })
</script>

<template>
  <WorkspaceFrame eyebrow="Perfil profesional" title="Mi perfil" subtitle="Mantén tus datos y experiencia al día para tus postulaciones." initials="JW">
    <template #heading-action><div class="profile-preview-actions"><RouterLink class="profile-preview-actions__back" to="/candidate">Volver al panel</RouterLink></div></template>
    <p v-if="error" class="workspace__error" role="alert">{{ error }}</p><p v-if="message" class="profile-message" role="status">{{ message }}</p><p v-if="loading" class="workspace__empty" role="status">Cargando perfil…</p>
    <template v-else-if="profile && options">
      <section class="candidate-profile-hero workspace__card" aria-label="Resumen de perfil">
        <img v-if="photoPreview" class="candidate-profile-hero__photo" :src="photoPreview" alt="Foto de perfil">
        <span v-else class="candidate-profile-hero__initials">{{ profile.firstName.slice(0,1) }}{{ profile.lastName.slice(0,1) }}</span>
        <div class="candidate-profile-hero__identity"><span class="candidate-profile-hero__eyebrow">Perfil profesional</span><h2>{{ form.firstName }} {{ form.lastName }}</h2><p>{{ professionalSummary }}</p><span class="candidate-profile-hero__location"><MapPin :size="16" />{{ candidateLocation }}</span></div>
        <div class="candidate-profile-hero__side"><span class="candidate-profile-hero__cv" :class="{ 'candidate-profile-hero__cv--ready': profile.cvUrl }"><i />{{ profile.cvUrl ? 'Currículum cargado' : 'Currículum pendiente' }}</span><RouterLink class="candidate-profile-hero__edit" to="#personal"><Pencil :size="16" />Editar perfil</RouterLink></div>
      </section>
      <div class="candidate-profile-layout">
      <div class="profile-content">
      <form id="personal" class="workspace__card profile-section" @submit.prevent="saveProfile"><h2><UserRound :size="19" />Información personal</h2><div class="profile-grid">
        <label>Nombre<input v-model="form.firstName" maxlength="100" placeholder="Tu nombre" required></label><label>Apellidos<input v-model="form.lastName" maxlength="100" placeholder="Tus apellidos" required></label><label>Correo de contacto<input v-model="form.contactEmail" type="email" maxlength="254" placeholder="nombre@correo.com"></label><label>Teléfono<input v-model="form.phone" type="tel" placeholder="+505 8888 8888"></label>
        <label>Departamento<select v-model="form.departmentId" @change="form.municipalityId = ''"><option value="">Selecciona</option><option v-for="item in options.departments" :key="item.id" :value="item.id">{{ item.name }}</option></select></label><label>Municipio<select v-model="form.municipalityId" :disabled="!form.departmentId"><option value="">Selecciona</option><option v-for="item in municipalities" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
        <label>Área profesional<select v-model="form.professionalAreaId" @change="form.specializationId = ''"><option value="">Selecciona</option><option v-for="item in options.professionalAreas" :key="item.id" :value="item.id">{{ item.name }}</option></select></label><label>Especialidad<select v-model="form.specializationId" :disabled="!form.professionalAreaId"><option value="">Sin especialidad</option><option v-for="item in specializations" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
        <label class="profile-grid__wide">Resumen profesional<textarea v-model="form.description" rows="4" maxlength="5000" placeholder="Resume tu experiencia, fortalezas y el tipo de oportunidad que buscas."></textarea></label>
      </div><button class="workspace__cta" type="submit" :disabled="saving">Guardar perfil</button></form>
      <section id="files" class="workspace__card profile-section"><h2><FileUser :size="19" />Foto y currículum</h2><div class="profile-files"><div><img v-if="photoPreview" class="profile-photo" :src="photoPreview" alt="Foto de perfil"><div v-else class="profile-photo-empty"><span><Camera :size="20" /></span><strong>Tu foto todavía no está aquí</strong><small>Un retrato profesional ayuda a que te reconozcan.</small></div><label class="profile-file-button"><Camera :size="15" />{{ saving ? 'Subiendo…' : 'Cambiar foto' }}<input type="file" accept="image/jpeg,image/png,image/webp" :disabled="saving" @change="upload('photo', $event)"></label><small>JPG, PNG o WebP · máximo 2 MB</small></div><div><p v-if="profile.cvUrl"><a :href="candidateFileUrl('cv', profile.cvUrl)" target="_blank" rel="noopener noreferrer">Descargar mi currículum</a></p><p v-else class="workspace__meta">Aún no subiste un currículum.</p><label class="profile-file-button"><FileUp :size="15" />{{ saving ? 'Subiendo…' : 'Subir currículum PDF' }}<input type="file" accept="application/pdf,.pdf" :disabled="saving" @change="upload('cv', $event)"></label><small>PDF · máximo 5 MB</small></div></div></section>
      <section id="experience" class="workspace__card profile-section profile-entries"><header class="profile-entries__heading"><div><h2><BriefcaseBusiness :size="19" />Experiencia laboral</h2><p>{{ experienceRows.length ? `${experienceRows.length} ${experienceRows.length === 1 ? 'experiencia guardada' : 'experiencias guardadas'}` : 'Tu recorrido laboral aparecerá aquí.' }}</p></div><button v-if="!showExperienceForm" class="profile-entry-add" type="button" :disabled="Boolean(editingExperienceId)" @click="showExperienceForm = true"><Plus :size="16" />Agregar experiencia</button></header>
        <div v-if="experienceRows.length" class="profile-entry-list"><article v-for="item in experienceRows" :key="item.id" class="profile-entry-card">
          <div v-if="editingExperienceId !== item.id" class="profile-entry-card__summary"><span class="profile-entry-card__icon"><BriefcaseBusiness :size="17" /></span><div class="profile-entry-card__copy"><div class="profile-entry-card__title"><h3>{{ item.position }}</h3><span>{{ experiencePeriod(item) }}</span></div><p>{{ item.company }}</p><p v-if="item.description" class="profile-entry-card__description">{{ item.description }}</p></div><div class="profile-entry-card__actions"><button type="button" :disabled="saving" @click="showExperienceForm = false; editingExperienceId = item.id">Editar</button><button class="profile-entry-card__delete" type="button" :disabled="saving" :aria-label="`Eliminar experiencia ${item.position}`" @click="removeExperience(item.id)"><Trash2 :size="15" /></button></div></div>
          <form v-else class="profile-entry-editor" @submit.prevent="updateExperience(item)"><div class="profile-entry-editor__heading"><strong>Editar experiencia</strong><button type="button" aria-label="Cancelar edición" @click="editingExperienceId = ''"><X :size="17" /></button></div><div class="profile-grid"><label>Puesto<input v-model="item.position" maxlength="160" placeholder="Ej. Analista contable" required></label><label>Empresa<input v-model="item.company" maxlength="160" placeholder="Nombre de la empresa" required></label><fieldset class="profile-date-fields"><legend>Inicio</legend><label>Año<input v-model="item.startYear" type="number" min="1900" :max="currentYear" placeholder="2022" required></label><label>Mes <span>(opcional)</span><select v-model="item.startMonth"><option value="">Solo año</option><option v-for="month in months" :key="month.value" :value="month.value">{{ month.label }}</option></select></label></fieldset><fieldset class="profile-date-fields"><legend>Fin <span>(opcional)</span></legend><label>Año<input v-model="item.endYear" type="number" min="1900" :max="currentYear" placeholder="Año"></label><label>Mes <span>(opcional)</span><select v-model="item.endMonth"><option value="">Solo año</option><option v-for="month in months" :key="month.value" :value="month.value">{{ month.label }}</option></select></label></fieldset><label class="profile-grid__wide">Descripción<textarea v-model="item.description" rows="3" maxlength="5000" placeholder="Responsabilidades y logros principales"></textarea></label></div><div class="profile-entry-editor__actions"><button class="profile-entry-cancel" type="button" @click="editingExperienceId = ''">Cancelar</button><button class="workspace__cta" type="submit" :disabled="saving">{{ saving ? 'Guardando…' : 'Guardar experiencia' }}</button></div></form>
        </article></div>
        <p v-else-if="!showExperienceForm" class="profile-entries__empty">Aún no has agregado experiencia. Si es tu primer empleo, puedes incluir prácticas, proyectos o trabajo independiente.</p>
        <form v-if="showExperienceForm" class="profile-entry-editor profile-entry-editor--new" @submit.prevent="addExperience"><div class="profile-entry-editor__heading"><div><strong>Nueva experiencia</strong><small>El registro aparecerá como una tarjeta cuando lo guardes.</small></div><button type="button" aria-label="Cancelar nueva experiencia" @click="showExperienceForm = false"><X :size="17" /></button></div><div class="profile-grid"><label>Puesto<input v-model="newExperience.position" required maxlength="160" placeholder="Ej. Analista contable"></label><label>Empresa<input v-model="newExperience.company" required maxlength="160" placeholder="Nombre de la empresa"></label><fieldset class="profile-date-fields"><legend>Inicio</legend><label>Año<input v-model="newExperience.startYear" type="number" min="1900" :max="currentYear" placeholder="2022" required></label><label>Mes <span>(opcional)</span><select v-model="newExperience.startMonth"><option value="">Solo año</option><option v-for="month in months" :key="month.value" :value="month.value">{{ month.label }}</option></select></label></fieldset><fieldset class="profile-date-fields"><legend>Fin <span>(opcional)</span></legend><label>Año<input v-model="newExperience.endYear" type="number" min="1900" :max="currentYear" placeholder="Año"></label><label>Mes <span>(opcional)</span><select v-model="newExperience.endMonth"><option value="">Solo año</option><option v-for="month in months" :key="month.value" :value="month.value">{{ month.label }}</option></select></label></fieldset><label class="profile-grid__wide">Descripción<textarea v-model="newExperience.description" rows="3" maxlength="5000" placeholder="Responsabilidades y logros principales"></textarea></label></div><div class="profile-entry-editor__actions"><button class="profile-entry-cancel" type="button" @click="showExperienceForm = false">Cancelar</button><button class="workspace__cta" type="submit" :disabled="saving">{{ saving ? 'Guardando…' : 'Guardar experiencia' }}</button></div></form>
      </section>
      <section id="education" class="workspace__card profile-section profile-entries"><header class="profile-entries__heading"><div><h2><GraduationCap :size="19" />Formación académica</h2><p>{{ educationRows.length ? `${educationRows.length} ${educationRows.length === 1 ? 'estudio registrado' : 'estudios registrados'}` : 'Tus estudios y certificaciones aparecerán aquí.' }}</p></div><button v-if="!showEducationForm" class="profile-entry-add" type="button" :disabled="Boolean(editingEducationId)" @click="showEducationForm = true"><Plus :size="16" />Agregar formación</button></header>
        <div v-if="educationRows.length" class="profile-entry-list"><article v-for="item in educationRows" :key="item.id" class="profile-entry-card"><div v-if="editingEducationId !== item.id" class="profile-entry-card__summary"><span class="profile-entry-card__icon profile-entry-card__icon--education"><GraduationCap :size="18" /></span><div class="profile-entry-card__copy"><div class="profile-entry-card__title"><h3>{{ item.degree }}</h3><span>{{ educationPeriod(item) }}</span></div><p>{{ item.institution }}</p></div><div class="profile-entry-card__actions"><button type="button" :disabled="saving" @click="showEducationForm = false; editingEducationId = item.id">Editar</button><button class="profile-entry-card__delete" type="button" :disabled="saving" :aria-label="`Eliminar formación ${item.degree}`" @click="removeEducation(item.id)"><Trash2 :size="15" /></button></div></div>
          <form v-else class="profile-entry-editor" @submit.prevent="updateEducation(item)"><div class="profile-entry-editor__heading"><strong>Editar formación</strong><button type="button" aria-label="Cancelar edición" @click="editingEducationId = ''"><X :size="17" /></button></div><div class="profile-grid"><label>Institución<input v-model="item.institution" maxlength="200" placeholder="Universidad o institución" required></label><label>Título o grado<input v-model="item.degree" maxlength="200" placeholder="Título obtenido" required></label><fieldset class="profile-date-fields"><legend>Inicio <span>(opcional)</span></legend><label>Año<input v-model="item.startYear" type="number" min="1900" :max="currentYear" placeholder="Año"></label><label>Mes <span>(opcional)</span><select v-model="item.startMonth"><option value="">Solo año</option><option v-for="month in months" :key="month.value" :value="month.value">{{ month.label }}</option></select></label></fieldset><fieldset class="profile-date-fields"><legend>Fin <span>(opcional)</span></legend><label>Año<input v-model="item.endYear" type="number" min="1900" :max="currentYear" placeholder="Año"></label><label>Mes <span>(opcional)</span><select v-model="item.endMonth"><option value="">Solo año</option><option v-for="month in months" :key="month.value" :value="month.value">{{ month.label }}</option></select></label></fieldset></div><div class="profile-entry-editor__actions"><button class="profile-entry-cancel" type="button" @click="editingEducationId = ''">Cancelar</button><button class="workspace__cta" type="submit" :disabled="saving">{{ saving ? 'Guardando…' : 'Guardar formación' }}</button></div></form>
        </article></div>
        <p v-else-if="!showEducationForm" class="profile-entries__empty">Aún no has agregado formación. Puedes incluir estudios en curso, títulos o certificaciones relevantes.</p>
        <form v-if="showEducationForm" class="profile-entry-editor profile-entry-editor--new" @submit.prevent="addEducation"><div class="profile-entry-editor__heading"><div><strong>Nueva formación</strong><small>El registro aparecerá como una tarjeta cuando lo guardes.</small></div><button type="button" aria-label="Cancelar nueva formación" @click="showEducationForm = false"><X :size="17" /></button></div><div class="profile-grid"><label>Institución<input v-model="newEducation.institution" required maxlength="200" placeholder="Universidad o institución"></label><label>Título o grado<input v-model="newEducation.degree" required maxlength="200" placeholder="Título o grado"></label><fieldset class="profile-date-fields"><legend>Inicio <span>(opcional)</span></legend><label>Año<input v-model="newEducation.startYear" type="number" min="1900" :max="currentYear" placeholder="Año"></label><label>Mes <span>(opcional)</span><select v-model="newEducation.startMonth"><option value="">Solo año</option><option v-for="month in months" :key="month.value" :value="month.value">{{ month.label }}</option></select></label></fieldset><fieldset class="profile-date-fields"><legend>Fin <span>(opcional)</span></legend><label>Año<input v-model="newEducation.endYear" type="number" min="1900" :max="currentYear" placeholder="Año"></label><label>Mes <span>(opcional)</span><select v-model="newEducation.endMonth"><option value="">Solo año</option><option v-for="month in months" :key="month.value" :value="month.value">{{ month.label }}</option></select></label></fieldset></div><div class="profile-entry-editor__actions"><button class="profile-entry-cancel" type="button" @click="showEducationForm = false">Cancelar</button><button class="workspace__cta" type="submit" :disabled="saving">{{ saving ? 'Guardando…' : 'Guardar formación' }}</button></div></form>
      </section>
      <section class="workspace__card profile-section profile-section--languages"><h2><Languages :size="19" />Idiomas</h2><div class="language-list"><article v-for="item in profile.languages" :key="item.language.id" class="language-record"><strong>{{ item.language.name }}</strong><select :value="item.level" :disabled="saving" @change="saveLanguage(item.language.id, ($event.target as HTMLSelectElement).value)"><option value="BASIC">Básico</option><option value="INTERMEDIATE">Intermedio</option><option value="ADVANCED">Avanzado</option><option value="NATIVE">Nativo</option></select><button type="button" :disabled="saving" @click="removeLanguage(item.language.id)">Quitar</button></article></div><form v-if="languagesNotAdded.length" class="language-record" @submit.prevent="newLanguageId && saveLanguage(newLanguageId, newLanguageLevel)"><select v-model="newLanguageId" required><option value="">Añadir idioma</option><option v-for="language in languagesNotAdded" :key="language.id" :value="language.id">{{ language.name }}</option></select><select v-model="newLanguageLevel"><option value="BASIC">Básico</option><option value="INTERMEDIATE">Intermedio</option><option value="ADVANCED">Avanzado</option><option value="NATIVE">Nativo</option></select><button class="workspace__cta" type="submit" :disabled="saving || !newLanguageId">Agregar idioma</button></form></section>
      </div>
      <aside class="candidate-profile-aside" aria-label="Progreso de tu perfil y siguientes pasos">
        <section class="candidate-profile-aside__journey workspace__card">
          <header class="candidate-profile-aside__journey-head"><span class="candidate-profile-aside__overline">Tu perfil toma forma</span><span class="candidate-profile-aside__percent">{{ profileCompletion }}%</span></header>
          <h2>Haz que tu experiencia hable por ti.</h2>
          <p>Cada detalle ayuda a las empresas a entender qué puedes aportar.</p>
          <div class="candidate-profile-aside__progress" role="progressbar" :aria-valuenow="profileCompletion" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso del perfil"><span :style="{ width: `${profileCompletion}%` }" /></div>
          <span class="candidate-profile-aside__count">{{ completedProfileItems }} de {{ completionItems.length }} detalles completados</span>
          <ol class="candidate-profile-aside__stages"><li v-for="(stage, index) in profileStages" :key="stage.title" :class="{ 'is-complete': stage.done, 'is-current': !stage.done && (index === 0 || profileStages[index - 1]?.done) }"><span class="candidate-profile-aside__stage-mark"><Check v-if="stage.done" :size="13" /><span v-else>{{ String(index + 1).padStart(2, '0') }}</span></span><span><strong>{{ stage.title }}</strong><small>{{ stage.detail }}</small></span></li></ol>
          <a v-if="nextProfileStep" class="candidate-profile-aside__next" :href="nextProfileStep.target"><span><small>Siguiente paso</small><strong>{{ nextProfileStep.label }}</strong></span><ArrowRight :size="17" /></a>
          <p v-else class="candidate-profile-aside__complete"><Check :size="16" />Tu perfil ya está completo. ¡Buen trabajo!</p>
        </section>
        <RouterLink class="candidate-profile-aside__preview" to="/candidate/profile/preview"><span class="candidate-profile-aside__preview-icon"><Eye :size="18" /></span><span><strong>Así te verá una empresa</strong><small>Revisa la presentación de tu perfil</small></span><ArrowRight :size="16" /></RouterLink>
        <RouterLink class="candidate-profile-aside__jobs" to="/jobs"><span class="candidate-profile-aside__jobs-icon"><BriefcaseBusiness :size="18" /></span><span><strong>Explorar vacantes</strong><small>Encuentra tu próximo reto profesional</small></span><ArrowRight :size="16" /></RouterLink>
      </aside>
      </div>
    </template>
  </WorkspaceFrame>
</template>

<style scoped>
.profile-section { padding: clamp(1rem,3vw,1.6rem); margin-top: 1rem; }.profile-section h2 { margin: 0 0 1rem; font: 750 1.15rem Manrope,sans-serif; }.profile-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: .9rem; margin-bottom: 1rem; }.profile-grid label { display: grid; gap: .35rem; color: var(--muted-foreground); font-size: .82rem; font-weight: 700; }.profile-grid input,.profile-grid select,.profile-grid textarea,.language-record select { min-width: 0; min-height: 2.6rem; padding: .6rem .7rem; border: 1px solid var(--border); border-radius: .55rem; background: var(--surface); color: var(--foreground); font: inherit; }.profile-grid textarea { resize: vertical; }.profile-grid__wide { grid-column: 1/-1; }.profile-record { padding: 1rem 0; border-top: 1px solid var(--border); }.profile-files { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 1rem; }.profile-files a { color: var(--primary); font-weight: 700; }.profile-files small { display: block; margin-top: .4rem; color: var(--muted-foreground); }.profile-photo { width: 5rem; height: 5rem; margin-bottom: .7rem; object-fit: cover; border-radius: 50%; }.profile-file-button { display: inline-flex; position: relative; min-height: 2.6rem; align-items: center; padding: 0 .8rem; border: 1px solid var(--border); border-radius: 999px; color: var(--primary); font-weight: 700; cursor: pointer; }.profile-file-button input { position: absolute; inset: 0; width: 100%; opacity: 0; cursor: pointer; }.profile-actions,.language-record { display: flex; align-items: center; gap: .7rem; }.profile-actions button,.language-record button { padding: .45rem .7rem; border: 1px solid var(--border); border-radius: 999px; background: var(--surface); color: var(--foreground); cursor: pointer; }.language-record { justify-content: space-between; padding: .6rem 0; border-top: 1px solid var(--border); }.language-record select { flex: 1; max-width: 14rem; }.profile-message { color: var(--primary); font-weight: 700; }
@media(max-width:640px){.profile-grid,.profile-files{grid-template-columns:1fr}.profile-grid__wide{grid-column:auto}.language-record{flex-wrap:wrap}}
</style>

<style scoped>
.profile-photo-empty{display:grid;justify-items:start;gap:.35rem;margin-bottom:.7rem}
.profile-photo-empty>span{display:grid;width:3rem;height:3rem;place-items:center;border:1px solid #dce7fa;border-radius:.8rem;background:#edf3ff;color:#3865cf}
.profile-photo-empty strong{color:var(--foreground);font-size:.77rem}
.profile-photo-empty small{max-width:17rem;margin:0!important;color:var(--muted-foreground);font-size:.68rem;line-height:1.45}
.profile-file-button{gap:.4rem;border-radius:.65rem!important;background:var(--surface);transition:border-color .18s,background .18s,color .18s}
.profile-file-button:hover{border-color:var(--primary);background:color-mix(in srgb,var(--primary) 5%,var(--surface))}
.language-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr));gap:.45rem .65rem}
.language-list .language-record{display:grid;grid-template-columns:minmax(0,1fr) minmax(6.5rem,9rem) auto;align-items:center;gap:.5rem;min-width:0;padding:.45rem .55rem;border:1px solid var(--border);border-radius:.65rem;background:color-mix(in srgb,var(--panel) 55%,var(--surface))}
.language-list .language-record strong{min-width:0;font-size:.78rem}
.language-record select{box-sizing:border-box;width:100%;min-width:0;max-width:none;min-height:2.35rem;padding:.4rem .55rem;font-size:.74rem}
.language-record button{min-height:2.25rem;padding:.35rem .55rem;font-size:.68rem;white-space:nowrap}
form.language-record{display:grid;grid-template-columns:minmax(0,1fr) minmax(8rem,11rem) auto;align-items:center;gap:.55rem;margin-top:.6rem;padding:.6rem;border:1px dashed color-mix(in srgb,var(--primary) 35%,var(--border));border-radius:.7rem;background:color-mix(in srgb,var(--primary) 4%,var(--surface))}
form.language-record .workspace__cta{min-height:2.35rem;padding:.45rem .7rem;font-size:.72rem;white-space:nowrap}
.profile-entries__heading{display:flex;align-items:center;justify-content:space-between;gap:1rem}
.profile-entries__heading h2{margin:0!important}
.profile-entries__heading>div>p{margin:.3rem 0 0;color:var(--muted-foreground);font-size:.74rem}
.profile-entry-add{display:inline-flex;min-height:2.35rem;align-items:center;justify-content:center;gap:.4rem;padding:0 .75rem;border:1px solid color-mix(in srgb,var(--primary) 28%,var(--border));border-radius:.65rem;background:color-mix(in srgb,var(--primary) 7%,var(--surface));color:var(--primary);font:750 .74rem Manrope,sans-serif;cursor:pointer;transition:background .18s,border-color .18s,transform .18s}
.profile-entry-add:hover:not(:disabled){transform:translateY(-1px);border-color:var(--primary);background:color-mix(in srgb,var(--primary) 12%,var(--surface))}
.profile-entry-add:disabled{opacity:.5;cursor:not-allowed}
.profile-entry-list{display:grid;gap:.65rem;margin-top:.9rem}
.profile-entry-card{min-width:0;overflow:hidden;border:1px solid var(--border);border-radius:.75rem;background:color-mix(in srgb,var(--panel) 42%,var(--surface));transition:border-color .18s,box-shadow .18s}
.profile-entry-card:hover{border-color:color-mix(in srgb,var(--primary) 30%,var(--border));box-shadow:0 5px 16px color-mix(in srgb,var(--palette-ink) 6%,transparent)}
.profile-entry-card__summary{display:grid;grid-template-columns:2.35rem minmax(0,1fr) auto;align-items:start;gap:.7rem;padding:.85rem}
.profile-entry-card__icon{display:grid;width:2.25rem;height:2.25rem;place-items:center;border:1px solid #dce7fa;border-radius:.65rem;background:#edf3ff;color:#3865cf}
.profile-entry-card__icon--education{border-color:#d8eee7;background:#eaf7f2;color:#198461}
.profile-entry-card__copy{min-width:0}
.profile-entry-card__title{display:flex;align-items:baseline;justify-content:space-between;gap:.75rem}
.profile-entry-card__title h3{margin:0;color:var(--foreground);font:800 .84rem Manrope,sans-serif}
.profile-entry-card__title>span{flex:none;color:var(--muted-foreground);font-size:.68rem;font-weight:700}
.profile-entry-card__copy>p{margin:.25rem 0 0;color:var(--muted-foreground);font-size:.74rem;line-height:1.45}
.profile-entry-card__description{white-space:pre-line}
.profile-entry-card__actions{display:flex;align-items:center;gap:.35rem}
.profile-entry-card__actions button,.profile-entry-editor__heading>button{display:inline-flex;min-height:2rem;align-items:center;justify-content:center;gap:.3rem;padding:0 .55rem;border:1px solid var(--border);border-radius:.5rem;background:var(--surface);color:var(--foreground);font:700 .68rem Manrope,sans-serif;cursor:pointer}
.profile-entry-card__actions button:hover,.profile-entry-editor__heading>button:hover{border-color:var(--primary);color:var(--primary)}
.profile-entry-card__actions .profile-entry-card__delete{width:2rem;padding:0;color:#b54747}
.profile-entry-card__actions .profile-entry-card__delete:hover{border-color:#d88b8b;background:#fff5f5}
.profile-entry-editor{padding:.9rem;border-top:1px solid var(--border);background:var(--surface)}
.profile-entry-editor--new{margin-top:.85rem;border:1px dashed color-mix(in srgb,var(--primary) 48%,var(--border));border-radius:.75rem;background:color-mix(in srgb,var(--primary) 4%,var(--surface))}
.profile-entry-editor__heading{display:flex;align-items:center;justify-content:space-between;gap:.75rem}
.profile-entry-editor__heading>div{display:grid;gap:.2rem}
.profile-entry-editor__heading strong{color:var(--foreground);font:800 .84rem Manrope,sans-serif}
.profile-entry-editor__heading small{color:var(--muted-foreground);font-size:.7rem}
.profile-entry-editor .profile-grid{margin:.8rem 0}
.profile-date-fields{display:grid;grid-template-columns:minmax(4rem,.7fr) minmax(6rem,1.3fr);align-items:end;gap:.5rem;min-width:0;margin:0;padding:.45rem .55rem .55rem;border:1px solid var(--border);border-radius:.6rem}
.profile-date-fields legend{padding:0 .22rem;color:var(--foreground);font-size:.72rem;font-weight:800}
.profile-date-fields legend span,.profile-date-fields label span{color:var(--muted-foreground);font-weight:500}
.profile-date-fields label{display:grid;gap:.28rem;min-width:0;color:var(--muted-foreground);font-size:.68rem;font-weight:700}
.profile-date-fields input,.profile-date-fields select{box-sizing:border-box;width:100%;min-width:0;min-height:2.45rem;padding:.48rem .55rem;border:1px solid var(--border);border-radius:.5rem;background:var(--surface);color:var(--foreground);font:inherit}
.profile-entry-editor__actions{display:flex;justify-content:flex-end;gap:.5rem}
.profile-entry-editor__actions .workspace__cta{min-height:2.35rem;padding:.55rem .8rem;font-size:.73rem}
.profile-entry-cancel{min-height:2.35rem;padding:0 .75rem;border:1px solid var(--border);border-radius:.6rem;background:var(--surface);color:var(--muted-foreground);font:700 .72rem Manrope,sans-serif;cursor:pointer}
.profile-entries__empty{margin:.85rem 0 0;padding:.85rem;border:1px dashed var(--border);border-radius:.7rem;color:var(--muted-foreground);font-size:.76rem;line-height:1.55}
@media(max-width:650px){.profile-entries__heading{align-items:flex-start;flex-direction:column}.profile-entry-add{width:100%}.profile-entry-card__summary{grid-template-columns:2.1rem minmax(0,1fr);gap:.55rem;padding:.7rem}.profile-entry-card__icon{width:2rem;height:2rem}.profile-entry-card__actions{grid-column:2;justify-content:flex-end}.profile-entry-card__title{align-items:flex-start;flex-direction:column;gap:.2rem}.profile-entry-editor{padding:.75rem}.profile-date-fields{grid-template-columns:minmax(3.8rem,.7fr) minmax(5.8rem,1.3fr)}.language-list{grid-template-columns:1fr}.language-list .language-record{grid-template-columns:minmax(0,1fr) minmax(6.5rem,9rem) auto}.form.language-record{grid-template-columns:1fr}.profile-content .profile-section--languages{padding:.85rem 1rem}}
</style>

<style scoped>
.profile-content{overflow:hidden;border:1px solid var(--border);border-radius:1rem;background:var(--surface);box-shadow:0 12px 34px color-mix(in srgb,var(--palette-ink) 5%,transparent)}.profile-content .profile-section{margin:0;padding:1.2rem 1.35rem;border:0;border-bottom:1px solid var(--border);border-radius:0;background:transparent;box-shadow:none}.profile-content .profile-section:last-child{border-bottom:0}.profile-content .profile-section h2{display:flex;align-items:center;gap:.7rem;margin:0 0 .85rem;font-size:1rem}.profile-content .profile-section h2:before{width:.27rem;height:1.1rem;border-radius:3px;background:linear-gradient(var(--palette-violet),var(--primary));content:""}.profile-content .profile-record{padding:.85rem 0}.profile-content .profile-files{gap:1.25rem}.profile-content .profile-files>div{padding:.8rem;border:1px solid var(--border);border-radius:.75rem;background:color-mix(in srgb,var(--panel) 55%,var(--surface))}.profile-content .profile-file-button{border-radius:.65rem;background:var(--surface)}
.profile-preview-actions{display:flex;align-items:center;gap:.8rem}.profile-preview-actions__preview{display:inline-flex;min-height:2.55rem;align-items:center;padding:0 .85rem;border:1px solid var(--border);border-radius:.7rem;background:var(--surface);color:var(--primary);font-size:.76rem;font-weight:800}.profile-preview-actions__back{color:var(--muted-foreground);font-size:.76rem;font-weight:700}
.candidate-profile-hero{position:relative;display:flex;align-items:center;gap:1.2rem;overflow:hidden;margin-bottom:1rem;padding:1.25rem 1.45rem;background:linear-gradient(110deg,var(--palette-ink),#1769c2);color:#fff}.candidate-profile-hero:after{position:absolute;right:3.5rem;top:-4.5rem;width:11rem;height:11rem;border:1px solid rgb(255 255 255 / 17%);border-radius:50%;box-shadow:0 0 0 20px rgb(255 255 255 / 5%),0 0 0 40px rgb(255 255 255 / 4%);content:""}.candidate-profile-hero__photo,.candidate-profile-hero__initials{position:relative;z-index:1;width:5rem;height:5rem;flex:none;border:3px solid rgb(255 255 255 / 58%);border-radius:50%;object-fit:cover;box-shadow:0 7px 22px rgb(0 0 0 / 18%)}.candidate-profile-hero__initials{display:grid;place-items:center;background:rgb(255 255 255 / 14%);font:800 1.2rem Manrope,sans-serif}.candidate-profile-hero__identity{position:relative;z-index:1;min-width:0;flex:1}.candidate-profile-hero__eyebrow{color:rgb(255 255 255 / 66%);font-size:.65rem;font-weight:850;letter-spacing:.13em;text-transform:uppercase}.candidate-profile-hero__identity h2{margin:.25rem 0;font:800 1.4rem Manrope,sans-serif;letter-spacing:-.04em}.candidate-profile-hero__identity p,.candidate-profile-hero__location{display:block;margin:0;color:rgb(255 255 255 / 82%);font-size:.78rem}.candidate-profile-hero__cv{position:relative;z-index:1;display:inline-flex;align-items:center;gap:.45rem;border:1px solid rgb(255 255 255 / 28%);border-radius:999px;padding:.5rem .7rem;color:#fff;font-size:.7rem;font-weight:750;white-space:nowrap}.candidate-profile-hero__cv i{width:.48rem;height:.48rem;border-radius:50%;background:#ffd27a}.candidate-profile-hero__cv--ready i{background:#7de2b0}
@media(max-width:640px){.candidate-profile-hero{align-items:flex-start;flex-wrap:wrap;padding:1rem}.candidate-profile-hero__photo,.candidate-profile-hero__initials{width:4rem;height:4rem}.candidate-profile-hero__identity{min-width:calc(100% - 5.2rem)}.candidate-profile-hero__cv{margin-left:5rem}}
 .candidate-profile-layout{display:grid;grid-template-columns:minmax(0,2fr) minmax(15rem,.78fr);align-items:start;gap:1rem}
.profile-content{display:grid;gap:.85rem;min-width:0;overflow:visible;border:0;border-radius:0;background:transparent;box-shadow:none}
.profile-content .profile-section{padding:1.1rem 1.2rem;border:1px solid var(--border);border-radius:.85rem;background:var(--surface);box-shadow:0 5px 18px rgb(24 49 82 / 4%)}
.profile-content .profile-section h2{color:var(--foreground)}
.profile-content .profile-section h2:before{display:none}
.profile-content .profile-section h2 svg{flex:none;color:var(--primary)}
.profile-content .profile-record{padding:.85rem 0}
.profile-content .profile-files>div{background:var(--panel)}
.candidate-profile-hero__side{position:relative;z-index:1;display:grid;justify-items:center;gap:.55rem;min-width:8rem}
.candidate-profile-aside__ring{--completion:0%;display:grid;width:3.35rem;aspect-ratio:1;place-items:center;border-radius:50%;background:radial-gradient(closest-side,var(--palette-ink) 79%,transparent 81% 99%),conic-gradient(#6cd7e9 var(--completion),rgb(255 255 255 / 20%) 0);color:#fff;font-size:.72rem;font-weight:850}
.candidate-profile-hero__cv{padding:.35rem .55rem;font-size:.62rem}
.candidate-profile-hero__edit{display:inline-flex;align-items:center;gap:.35rem;color:#fff;font-size:.7rem;font-weight:800}
.candidate-profile-aside{position:sticky;top:5.3rem;display:grid;gap:.8rem;min-width:0}
.candidate-profile-aside .workspace__card{padding:1rem;border:1px solid var(--border);border-radius:.85rem;background:var(--surface);box-shadow:none}
.candidate-profile-aside__score{background:linear-gradient(145deg,var(--palette-ink),#1d3961)!important;color:#fff}
.candidate-profile-aside__score-head{display:flex;align-items:center;justify-content:space-between;gap:.7rem}
.candidate-profile-aside__score-head>span,.candidate-profile-aside__tips h2{display:flex;align-items:center;gap:.5rem;font-size:.83rem;font-weight:800}
.candidate-profile-aside__score-head svg,.candidate-profile-aside__tips h2 svg{color:#85b7ff}
.candidate-profile-aside__ring{width:3rem;background:radial-gradient(closest-side,#1b3455 79%,transparent 81% 99%),conic-gradient(#8eb4ff var(--completion),rgb(255 255 255 / 17%) 0);font-size:.65rem}
.candidate-profile-aside__score p,.candidate-profile-aside__tips p{color:var(--muted-foreground);font-size:.74rem;line-height:1.55}
.candidate-profile-aside__score p{color:rgb(255 255 255 / 75%)}
.candidate-profile-aside__score .workspace__cta{width:100%;gap:.4rem;background:#fff;color:#2358d9;box-shadow:none}
.candidate-profile-aside__tips h2{margin:0 0 .65rem;font-size:.9rem}
.candidate-profile-aside__tips ul{display:grid;gap:.55rem;margin:0;padding:0;list-style:none}
.candidate-profile-aside__tips li{display:flex;align-items:center;gap:.5rem;color:var(--muted-foreground);font-size:.72rem}
.candidate-profile-aside__tips li svg{flex:none;color:#16865c}
.candidate-profile-aside__pending{width:.55rem;height:.55rem;flex:none;border:1px solid var(--border);border-radius:50%}
.candidate-profile-aside__preview,.candidate-profile-aside__jobs{display:flex;align-items:center;justify-content:space-between;gap:.6rem;padding:.8rem;border:1px solid var(--border);border-radius:.75rem;background:var(--surface);color:var(--foreground)}
.candidate-profile-aside__preview>span,.candidate-profile-aside__jobs{display:flex;align-items:center;gap:.6rem}
.candidate-profile-aside__preview>span>svg,.candidate-profile-aside__jobs>svg{flex:none;color:var(--primary)}
.candidate-profile-aside__preview strong,.candidate-profile-aside__preview small,.candidate-profile-aside__jobs strong,.candidate-profile-aside__jobs small{display:block}
.candidate-profile-aside__preview strong,.candidate-profile-aside__jobs strong{font-size:.74rem}
.candidate-profile-aside__preview small,.candidate-profile-aside__jobs small{margin-top:.2rem;color:var(--muted-foreground);font-size:.65rem;line-height:1.4}
.candidate-profile-aside__jobs{background:var(--secondary)}
.candidate-profile-aside__jobs>span{min-width:0;flex:1}
.candidate-profile-hero__location{display:flex;align-items:center;gap:.35rem;margin-top:.4rem!important}
@media(max-width:900px){.candidate-profile-layout{grid-template-columns:minmax(0,1fr)}.candidate-profile-aside{position:static;grid-template-columns:repeat(2,minmax(0,1fr))}.candidate-profile-aside__score{grid-row:span 2}}
@media(max-width:620px){.candidate-profile-aside{grid-template-columns:1fr}.candidate-profile-aside__score{grid-row:auto}.candidate-profile-hero__side{margin-left:5rem;justify-items:start}.candidate-profile-hero__completion{display:none}}

.candidate-profile-aside{gap:.7rem}
.candidate-profile-aside__journey{position:relative;isolation:isolate;overflow:hidden;padding:1.1rem!important;border:1px solid rgb(171 198 235 / 18%)!important;border-radius:1rem!important;background:linear-gradient(150deg,#102747 0%,#163b68 60%,#214e83 100%)!important;color:#fff}
.candidate-profile-aside__journey:after{position:absolute;z-index:-1;top:4.8rem;right:-4.1rem;width:10rem;height:10rem;border:1px solid rgb(190 218 255 / 12%);border-radius:50%;box-shadow:0 0 0 1.1rem rgb(190 218 255 / 4%),0 0 0 2.2rem rgb(190 218 255 / 3%);content:""}
.candidate-profile-aside__journey-head{display:flex;align-items:center;justify-content:space-between;gap:.7rem}
.candidate-profile-aside__overline{color:#a9c8f0;font-size:.61rem;font-weight:850;letter-spacing:.14em;text-transform:uppercase}
.candidate-profile-aside__percent{display:grid;min-width:2.6rem;height:2.6rem;place-items:center;border:2px solid #73cde0;border-radius:50%;background:#16385e;color:#fff;font-size:.68rem;font-weight:850}
.candidate-profile-aside__journey>h2{max-width:15rem;margin:.7rem 0 .35rem;color:#fff;font:800 1.16rem/1.2 Manrope,sans-serif;letter-spacing:-.035em}
.candidate-profile-aside__journey>p{margin:.3rem 0 .75rem;color:rgb(232 241 253 / 74%);font-size:.72rem;line-height:1.55}
.candidate-profile-aside__progress{height:.35rem;overflow:hidden;border-radius:999px;background:rgb(255 255 255 / 17%)}
.candidate-profile-aside__progress>span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#59c3de,#a7dded);transition:width .35s ease}
.candidate-profile-aside__count{display:block;margin-top:.4rem;color:#c6d8ef;font-size:.64rem;font-weight:700}
.candidate-profile-aside__stages{display:grid;gap:0;margin:.75rem 0;padding:0;list-style:none}
.candidate-profile-aside__stages li{position:relative;display:flex;align-items:center;gap:.65rem;min-height:3rem;color:#9eb3cf}
.candidate-profile-aside__stages li+li:before{position:absolute;top:-.4rem;left:.68rem;height:.8rem;border-left:1px solid rgb(203 220 242 / 24%);content:""}
.candidate-profile-aside__stage-mark{display:grid;width:1.4rem;height:1.4rem;flex:none;place-items:center;border:1px solid rgb(207 224 247 / 28%);border-radius:50%;color:#b7c8dd;font-size:.56rem;font-weight:850}
.candidate-profile-aside__stages li.is-current .candidate-profile-aside__stage-mark{border-color:#73cde0;background:rgb(115 205 224 / 16%);color:#9ce8f3;box-shadow:0 0 0 3px rgb(115 205 224 / 8%)}
.candidate-profile-aside__stages li.is-complete .candidate-profile-aside__stage-mark{border-color:#75d9b3;background:#75d9b3;color:#123251}
.candidate-profile-aside__stages li>span:last-child{display:grid;gap:.12rem}
.candidate-profile-aside__stages strong{color:#edf5ff;font-size:.7rem;font-weight:780}
.candidate-profile-aside__stages small{color:#b5c8df;font-size:.62rem}
.candidate-profile-aside__next{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.65rem .7rem;border:1px solid rgb(255 255 255 / 45%);border-radius:.7rem;background:#f7faff;color:#15345b;transition:transform .18s,background .18s}
.candidate-profile-aside__next:hover{transform:translateY(-1px);background:#fff}
.candidate-profile-aside__next>span{display:grid;gap:.15rem}
.candidate-profile-aside__next small{color:#60738e;font-size:.6rem;font-weight:750;text-transform:uppercase;letter-spacing:.08em}
.candidate-profile-aside__next strong{font-size:.72rem}
.candidate-profile-aside__next>svg{color:#3268dd}
.candidate-profile-aside__complete{display:flex;align-items:center;gap:.45rem;margin:.4rem 0 0!important;padding:.65rem;border:1px solid rgb(117 217 179 / 35%);border-radius:.7rem;background:rgb(117 217 179 / 10%);color:#bcf5dd!important;font-size:.69rem!important}
.candidate-profile-aside__preview,.candidate-profile-aside__jobs{position:relative;min-height:4.25rem;padding:.65rem .75rem;border-radius:.8rem;transition:transform .18s,border-color .18s,box-shadow .18s}
.candidate-profile-aside__preview:hover,.candidate-profile-aside__jobs:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--primary) 35%,var(--border));box-shadow:0 8px 20px rgb(25 52 89 / 8%)}
.candidate-profile-aside__preview-icon,.candidate-profile-aside__jobs-icon{display:grid;width:2.2rem;height:2.2rem;flex:none;place-items:center;border-radius:.7rem;background:#eaf0ff;color:#345fd4}
.candidate-profile-aside__preview>span:nth-child(2),.candidate-profile-aside__jobs>span:nth-child(2){min-width:0;flex:1}
.candidate-profile-aside__preview strong,.candidate-profile-aside__jobs strong{font-size:.7rem}
.candidate-profile-aside__preview small,.candidate-profile-aside__jobs small{font-size:.61rem}
.candidate-profile-aside__preview>svg,.candidate-profile-aside__jobs>svg{color:#687d9b}
.candidate-profile-aside__jobs{border-color:#102747;background:#102747;color:#fff}
.candidate-profile-aside__jobs:hover{border-color:#38639a;background:#16375e}
.candidate-profile-aside__jobs-icon{background:rgb(255 255 255 / 12%);color:#9fc4ff}
.candidate-profile-aside__jobs strong{color:#fff}
.candidate-profile-aside__jobs small{color:#c1d0e4}
.candidate-profile-aside__jobs>svg{color:#c1d0e4}
@media(max-width:900px){.candidate-profile-aside__journey{grid-column:1/-1}}
@media(max-width:620px){.candidate-profile-aside__journey{grid-column:auto}}
.candidate-profile-hero__location{display:inline-flex;align-items:center;gap:.35rem;margin-top:.25rem}
</style>
