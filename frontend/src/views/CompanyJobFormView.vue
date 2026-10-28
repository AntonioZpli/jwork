<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { BriefcaseBusiness } from 'lucide-vue-next'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import { workspaceApi, type CompanyJob, type JobFormOptions } from '@/services/workspace'

const route = useRoute()
const router = useRouter()
const jobId = computed(() => typeof route.params.id === 'string' ? route.params.id : '')
const editing = computed(() => Boolean(jobId.value))
const options = ref<JobFormOptions | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const fieldErrors = ref<Record<string, string>>({})
const form = reactive({
  title: '', description: '', requirements: '', professionalAreaId: '', specializationId: '',
  departmentId: '', municipalityId: '', workMode: 'ONSITE', remoteScope: '', contractType: 'PERMANENT',
  workday: 'FULL_TIME', scheduleType: 'FIXED', scheduleDescription: '', salaryMin: '', salaryMax: '',
  salaryCurrency: 'NIO', salaryPeriod: 'MONTHLY', salaryNegotiable: false, experienceYearsMin: '',
  isUrgent: false, vacancies: '1', expiresAt: '',
})
const municipalities = computed(() => options.value?.municipalities.filter(item => item.departmentId === form.departmentId) ?? [])
const specializations = computed(() => options.value?.specializations.filter(item => item.professionalAreaId === form.professionalAreaId) ?? [])
const previewArea = computed(() => options.value?.professionalAreas.find(item => item.id === form.professionalAreaId)?.name ?? 'Área profesional')
const previewLocation = computed(() => {
  if (form.workMode === 'REMOTE') return 'Remoto'
  const municipality = municipalities.value.find(item => item.id === form.municipalityId)?.name
  const department = options.value?.departments.find(item => item.id === form.departmentId)?.name
  return [municipality, department].filter(Boolean).join(', ') || 'Ubicación por definir'
})
const previewSalary = computed(() => {
  if (!form.salaryMin && !form.salaryMax) return form.salaryNegotiable ? 'Salario negociable' : 'Salario sin especificar'
  const currency = form.salaryCurrency
  const period = form.salaryPeriod === 'YEARLY' ? 'al año' : form.salaryPeriod === 'MONTHLY' ? 'al mes' : form.salaryPeriod === 'WEEKLY' ? 'por semana' : form.salaryPeriod === 'BIWEEKLY' ? 'por quincena' : form.salaryPeriod === 'DAILY' ? 'por día' : 'por hora'
  const format = (value: string) => new Intl.NumberFormat('es-NI', { maximumFractionDigits: 0 }).format(Number(value))
  if (form.salaryMin && form.salaryMax) return `${currency} ${format(form.salaryMin)} – ${format(form.salaryMax)} ${period}`
  return form.salaryMin ? `Desde ${currency} ${format(form.salaryMin)} ${period}` : `Hasta ${currency} ${format(form.salaryMax)} ${period}`
})

function fill(job: CompanyJob) {
  Object.assign(form, {
    title: job.title, description: job.description, requirements: job.requirements,
    professionalAreaId: job.professionalAreaId, specializationId: job.specializationId ?? '',
    departmentId: job.departmentId ?? '', municipalityId: job.municipalityId ?? '',
    workMode: job.workMode, remoteScope: job.remoteScope ?? '', contractType: job.contractType,
    workday: job.workday, scheduleType: job.scheduleType, scheduleDescription: job.scheduleDescription ?? '',
    salaryMin: job.salaryMin == null ? '' : String(job.salaryMin), salaryMax: job.salaryMax == null ? '' : String(job.salaryMax),
    salaryCurrency: job.salaryCurrency ?? 'NIO', salaryPeriod: job.salaryPeriod ?? 'MONTHLY',
    salaryNegotiable: job.salaryNegotiable, experienceYearsMin: job.experienceYearsMin == null ? '' : String(job.experienceYearsMin),
    isUrgent: job.isUrgent, vacancies: String(job.vacancies), expiresAt: job.expiresAt?.slice(0, 10) ?? '',
  })
}

onMounted(async () => {
  try {
    options.value = await workspaceApi.companyJobOptions()
    if (editing.value) {
      const { jobs } = await workspaceApi.companyJobs()
      const job = jobs.find(item => item.id === jobId.value)
      if (!job) throw new Error('No se encontró la vacante de esta empresa.')
      fill(job)
    }
  } catch (e) { error.value = e instanceof Error ? e.message : 'No se pudo cargar el formulario.' }
  finally { loading.value = false }
})

function validate() {
  const errors: Record<string, string> = {}
  if (!form.title.trim()) errors.title = 'Escribe el título de la vacante.'
  if (!form.description.trim()) errors.description = 'Agrega la descripción del puesto.'
  if (!form.requirements.trim()) errors.requirements = 'Indica los requisitos.'
  if (!form.professionalAreaId) errors.professionalAreaId = 'Selecciona el área profesional.'
  if (form.workMode === 'REMOTE' && !form.remoteScope) errors.remoteScope = 'Indica el alcance remoto.'
  const min = form.salaryMin === '' ? null : Number(form.salaryMin)
  const max = form.salaryMax === '' ? null : Number(form.salaryMax)
  if (min !== null && (!Number.isFinite(min) || min < 0)) errors.salaryMin = 'Ingresa un salario válido.'
  if (max !== null && (!Number.isFinite(max) || max < 0)) errors.salaryMax = 'Ingresa un salario válido.'
  if (min !== null && max !== null && min > max) errors.salaryMax = 'El máximo debe ser igual o mayor que el mínimo.'
  if (!Number.isInteger(Number(form.vacancies)) || Number(form.vacancies) < 1) errors.vacancies = 'Debe haber al menos una vacante.'
  fieldErrors.value = errors
  return !Object.keys(errors).length
}

async function save() {
  if (saving.value || !validate()) return
  saving.value = true
  error.value = ''
  const payload = {
    ...form,
    specializationId: form.specializationId || null,
    departmentId: form.departmentId || null,
    municipalityId: form.municipalityId || null,
    remoteScope: form.workMode === 'REMOTE' ? form.remoteScope : null,
    salaryMin: form.salaryMin === '' ? null : Number(form.salaryMin),
    salaryMax: form.salaryMax === '' ? null : Number(form.salaryMax),
    salaryCurrency: form.salaryMin === '' && form.salaryMax === '' ? null : form.salaryCurrency,
    salaryPeriod: form.salaryMin === '' && form.salaryMax === '' ? null : form.salaryPeriod,
    experienceYearsMin: form.experienceYearsMin === '' ? null : Number(form.experienceYearsMin),
    vacancies: Number(form.vacancies),
    scheduleDescription: form.scheduleDescription || null,
    expiresAt: form.expiresAt || null,
  }
  try {
    if (editing.value) await workspaceApi.updateCompanyJob(jobId.value, payload)
    else await workspaceApi.createCompanyJob(payload)
    await router.replace('/company/jobs')
  } catch (e) { error.value = e instanceof Error ? e.message : 'No se pudo guardar la vacante.' }
  finally { saving.value = false }
}
</script>

<template>
  <WorkspaceFrame eyebrow="Gestión de vacantes" :title="editing ? 'Editar vacante' : 'Crear vacante'" subtitle="Completa la información que verán los candidatos." initials="JW">
    <template #heading-action><RouterLink class="company-form__back" to="/company/jobs">Volver a mis vacantes</RouterLink></template>
    <p v-if="loading" role="status" class="workspace__empty">Cargando formulario…</p>
    <p v-if="error" role="alert" class="workspace__error">{{ error }}</p>
    <form v-if="!loading && options && !error" class="workspace__card company-form" @submit.prevent="save">
      <aside class="company-form__preview" aria-live="polite"><div class="company-form__preview-mark"><BriefcaseBusiness :size="19" /></div><div class="company-form__preview-copy"><span>Vista rápida para candidatos</span><h2>{{ form.title.trim() || 'El título de la vacante aparecerá aquí' }}</h2><p>{{ previewArea }} <span aria-hidden="true">·</span> {{ previewLocation }}</p><p class="company-form__preview-description">{{ form.description.trim() || 'Añade una descripción para mostrar los detalles del puesto.' }}</p><div class="company-form__preview-tags"><span>{{ form.workMode === 'REMOTE' ? 'Remoto' : form.workMode === 'HYBRID' ? 'Híbrido' : 'Presencial' }}</span><span>{{ form.contractType === 'PERMANENT' ? 'Permanente' : form.contractType === 'TEMPORARY' ? 'Temporal' : form.contractType === 'CONTRACT' ? 'Por contrato' : 'Pasantía' }}</span><span>{{ previewSalary }}</span></div></div></aside>
      <fieldset :disabled="saving">
        <legend>Información de la vacante</legend>
        <label>Título <input v-model="form.title" maxlength="160" placeholder="Ej. Diseñador/a gráfico/a" required><small v-if="fieldErrors.title">{{ fieldErrors.title }}</small></label>
        <label>Descripción <textarea v-model="form.description" maxlength="12000" rows="5" placeholder="Describe las responsabilidades y el impacto del puesto." required /><small v-if="fieldErrors.description">{{ fieldErrors.description }}</small></label>
        <label>Requisitos <textarea v-model="form.requirements" maxlength="12000" rows="5" placeholder="Incluye experiencia, conocimientos y habilidades necesarios." required /><small v-if="fieldErrors.requirements">{{ fieldErrors.requirements }}</small></label>
        <div class="company-form__grid">
          <label>Área profesional <select v-model="form.professionalAreaId" required><option value="">Selecciona</option><option v-for="item in options.professionalAreas" :key="item.id" :value="item.id">{{ item.name }}</option></select><small v-if="fieldErrors.professionalAreaId">{{ fieldErrors.professionalAreaId }}</small></label>
          <label>Especialidad <select v-model="form.specializationId"><option value="">Sin especificar</option><option v-for="item in specializations" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
        </div>
        <legend>Modalidad y ubicación</legend>
        <div class="company-form__grid">
          <label>Modalidad <select v-model="form.workMode"><option value="ONSITE">Presencial</option><option value="HYBRID">Híbrido</option><option value="REMOTE">Remoto</option></select></label>
          <label v-if="form.workMode === 'REMOTE'">Alcance remoto <select v-model="form.remoteScope" required><option value="">Selecciona</option><option value="NICARAGUA_ONLY">Solo Nicaragua</option><option value="INTERNATIONAL">Internacional</option></select><small v-if="fieldErrors.remoteScope">{{ fieldErrors.remoteScope }}</small></label>
          <label>Departamento <select v-model="form.departmentId"><option value="">Sin especificar</option><option v-for="item in options.departments" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
          <label>Municipio <select v-model="form.municipalityId" :disabled="!form.departmentId"><option value="">Sin especificar</option><option v-for="item in municipalities" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
        </div>
        <legend>Condiciones</legend>
        <div class="company-form__grid">
          <label>Tipo de contrato <select v-model="form.contractType"><option value="PERMANENT">Permanente</option><option value="TEMPORARY">Temporal</option><option value="CONTRACT">Por contrato</option><option value="INTERNSHIP">Pasantía</option></select></label>
          <label>Jornada <select v-model="form.workday"><option value="FULL_TIME">Tiempo completo</option><option value="PART_TIME">Tiempo parcial</option></select></label>
          <label>Horario <select v-model="form.scheduleType"><option value="FIXED">Fijo</option><option value="FLEXIBLE">Flexible</option><option value="SHIFT_BASED">Por turnos</option></select></label>
          <label>Descripción del horario <input v-model="form.scheduleDescription" maxlength="500" placeholder="Ej. Lunes a viernes, 8:00 a. m. a 5:00 p. m."></label>
          <label>Salario mínimo <input v-model="form.salaryMin" type="number" min="0" step="0.01" placeholder="Ej. 18000"><small v-if="fieldErrors.salaryMin">{{ fieldErrors.salaryMin }}</small></label>
          <label>Salario máximo <input v-model="form.salaryMax" type="number" min="0" step="0.01" placeholder="Ej. 25000"><small v-if="fieldErrors.salaryMax">{{ fieldErrors.salaryMax }}</small></label>
          <label>Moneda <select v-model="form.salaryCurrency"><option value="NIO">Córdobas (NIO)</option><option value="USD">Dólares (USD)</option></select></label>
          <label>Período salarial <select v-model="form.salaryPeriod"><option value="HOURLY">Por hora</option><option value="DAILY">Por día</option><option value="WEEKLY">Semanal</option><option value="BIWEEKLY">Quincenal</option><option value="MONTHLY">Mensual</option><option value="YEARLY">Anual</option></select></label>
          <label>Experiencia mínima (años) <input v-model="form.experienceYearsMin" type="number" min="0" max="60" step="1" placeholder="Ej. 2"></label>
          <label>Número de vacantes <input v-model="form.vacancies" type="number" min="1" max="1000" step="1" required><small v-if="fieldErrors.vacancies">{{ fieldErrors.vacancies }}</small></label>
          <label>Fecha de vencimiento <input v-model="form.expiresAt" type="date"></label>
        </div>
        <label class="company-form__check"><input v-model="form.salaryNegotiable" type="checkbox"> Salario negociable</label>
        <label class="company-form__check"><input v-model="form.isUrgent" type="checkbox"> Marcar como urgente</label>
      </fieldset>
      <div class="company-form__actions"><RouterLink class="company-form__back" to="/company/jobs">Cancelar</RouterLink><button class="workspace__cta" type="submit" :disabled="saving">{{ saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar borrador' }}</button></div>
    </form>
  </WorkspaceFrame>
</template>

<style scoped>
.company-form { padding: clamp(1rem, 3vw, 2rem); }
.company-form fieldset { display: grid; gap: 1rem; border: 0; margin: 0; padding: 0; }
.company-form legend { width: 100%; margin: 1rem 0 .25rem; padding-bottom: .65rem; border-bottom: 1px solid var(--border); font: 750 1.1rem Manrope, sans-serif; }
.company-form label { display: grid; gap: .4rem; font-size: .88rem; font-weight: 700; }
.company-form input:not([type=checkbox]), .company-form select, .company-form textarea { width: 100%; min-height: 2.8rem; padding: .65rem .75rem; border: 1px solid var(--border); border-radius: .65rem; background: var(--surface); color: var(--foreground); font: inherit; }
.company-form textarea { resize: vertical; }
.company-form small { color: #a12626; font-weight: 500; }
.company-form__grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 1rem; }
.company-form__check { display: flex !important; align-items: center; margin-top: .85rem; }
.company-form__actions { display: flex; justify-content: end; gap: .8rem; margin-top: 1.5rem; }
.company-form__back { display: inline-flex; align-items: center; color: var(--primary); font-weight: 700; }
@media (max-width: 640px) { .company-form__grid { grid-template-columns: 1fr; } }
</style>

<style scoped>
.company-form{padding:1.25rem 1.5rem}.company-form fieldset{gap:.65rem}.company-form legend{margin:1.1rem 0 .4rem;padding:.75rem 0 .45rem;border-bottom:1px solid var(--border);color:var(--palette-ink);font-size:.88rem;letter-spacing:.01em}.company-form legend:first-child{margin-top:0;padding-top:0}.dark .company-form legend{color:var(--palette-blue)}.company-form__grid{gap:.75rem;padding:.8rem;border:1px solid color-mix(in srgb,var(--border) 78%,transparent);border-radius:.75rem;background:color-mix(in srgb,var(--panel) 52%,var(--surface))}.company-form label{gap:.3rem;font-size:.76rem}.company-form input:not([type=checkbox]),.company-form select,.company-form textarea{min-height:2.5rem;padding:.55rem .65rem;border-radius:.55rem;font-size:.83rem}.company-form textarea{min-height:6rem}.company-form__check{gap:.55rem!important;margin-top:.35rem!important;color:var(--muted-foreground);font-size:.75rem!important}.company-form__check input{accent-color:var(--palette-violet)}.company-form__actions{padding-top:.9rem;border-top:1px solid var(--border)}.company-form__back{font-size:.8rem}
@media(max-width:640px){.company-form{padding:1rem}.company-form__grid{gap:.6rem;padding:.65rem}}

.company-form__preview{display:flex;align-items:flex-start;gap:.85rem;margin:0 0 1rem;padding:1rem;border:1px solid rgb(126 168 226 / 24%);border-radius:.85rem;background:linear-gradient(120deg,#102747,#1a3c67);color:#fff}
.company-form__preview-mark{display:grid;width:2.4rem;height:2.4rem;flex:none;place-items:center;border:1px solid rgb(255 255 255 / 20%);border-radius:.7rem;background:rgb(255 255 255 / 10%);color:#a9c8ff}
.company-form__preview-copy{min-width:0;flex:1}
.company-form__preview-copy>span{color:#a9c8f0;font-size:.6rem;font-weight:850;letter-spacing:.12em;text-transform:uppercase}
.company-form__preview-copy h2{margin:.3rem 0;color:#fff;font:800 1rem/1.3 Manrope,sans-serif;letter-spacing:-.025em}
.company-form__preview-copy>p{margin:.25rem 0;color:#cbd9eb;font-size:.72rem}
.company-form__preview-copy>p>span{padding-inline:.2rem;color:#81a9dd}
.company-form__preview-description{display:-webkit-box!important;overflow:hidden;max-width:55rem;-webkit-box-orient:vertical;-webkit-line-clamp:2;color:rgb(235 243 253 / 74%)!important;line-height:1.5}
.company-form__preview-tags{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.6rem}
.company-form__preview-tags span{padding:.3rem .5rem;border:1px solid rgb(255 255 255 / 18%);border-radius:999px;background:rgb(255 255 255 / 7%);color:#f1f6ff;font-size:.63rem;font-weight:700}
@media(max-width:600px){.company-form__preview{padding:.8rem}.company-form__preview-mark{width:2rem;height:2rem}}
</style>
