<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, CircleCheck, MapPin, ShieldCheck, UserRound } from '@lucide/vue'
import AuthFeedback from '@/components/auth/AuthFeedback.vue'
import { authApi, type OnboardingCatalogs, type OnboardingProfile } from '@/services/auth'

const router = useRouter()
const loading = ref(true)
const saving = ref(false)
const isError = ref(false)
const errorMessage = ref('')
const accountEmail = ref('')
const emailVerified = ref(false)
const completed = ref(false)
const role = ref<'CANDIDATE' | 'COMPANY'>('CANDIDATE')
const step = ref(1)
const catalogs = ref<OnboardingCatalogs>({ departments: [], municipalities: [] })
const fieldErrors = reactive({ firstName: '', lastName: '', phone: '', departmentId: '', municipalityId: '', professionalAreaId: '', companyName: '', website: '', contactEmail: '' })
const form = reactive({
  firstName: '', lastName: '', phone: '', departmentId: '', municipalityId: '',
  professionalAreaId: '', specializationId: '', companyName: '', description: '',
  website: '', economicSectorId: '', address: '', contactEmail: '',
})

const isCandidate = computed(() => role.value === 'CANDIDATE')
const filteredMunicipalities = computed(() => catalogs.value.municipalities.filter((item) => item.departmentId === form.departmentId))
const filteredSpecializations = computed(() => catalogs.value.specializations?.filter((item) => item.professionalAreaId === form.professionalAreaId) ?? [])
const progressWidth = computed(() => (step.value / 3 * 100) + '%')
const departmentName = computed(() => catalogs.value.departments.find((item) => item.id === form.departmentId)?.name ?? '')
const municipalityName = computed(() => filteredMunicipalities.value.find((item) => item.id === form.municipalityId)?.name ?? '')
const areaName = computed(() => catalogs.value.professionalAreas?.find((item) => item.id === form.professionalAreaId)?.name ?? '')
const specializationName = computed(() => catalogs.value.specializations?.find((item) => item.id === form.specializationId)?.name ?? '')
const phoneDigits = computed(() => form.phone.replace(/\D/g, '').replace(/^505(?=\d{8}$)/, ''))
const catalogsReady = computed(() => isCandidate.value
  ? Boolean(catalogs.value.departments.length && catalogs.value.municipalities.length && catalogs.value.professionalAreas?.length)
  : Boolean(catalogs.value.departments.length && catalogs.value.municipalities.length && catalogs.value.economicSectors?.length))
const title = computed(() => step.value === 1
  ? (isCandidate.value ? 'Empecemos con lo básico' : 'Cuéntanos sobre tu empresa')
  : step.value === 2
    ? (isCandidate.value ? '¿A qué te dedicas?' : 'Ubicación y contacto')
    : (isCandidate.value ? 'Revisa tu perfil' : 'Revisa los datos de tu empresa'))
const description = computed(() => step.value === 1
  ? (isCandidate.value ? 'Usaremos estos datos para identificarte y ayudarte a encontrar oportunidades cerca de ti.' : 'Agrega la información básica de la organización.')
  : step.value === 2
    ? (isCandidate.value ? 'Indica tu ubicación y área profesional para mostrarte empleos relevantes.' : 'Los datos de contacto serán independientes del correo con el que inicias sesión.')
    : 'Confirma que la información esté correcta. Podrás actualizarla desde tu perfil.')
const asideTitle = computed(() => isCandidate.value ? 'Tu próxima oportunidad empieza aquí.' : 'Tu empresa empieza con una buena primera impresión.')
const asideDescription = computed(() => isCandidate.value ? 'Completa tu perfil para que las empresas puedan conocerte mejor.' : 'Completa la información comercial y de contacto para que los candidatos te encuentren.')
const asidePrivacyText = computed(() => isCandidate.value ? 'Tus datos se usan para crear tu perfil y conectar con empleos.' : 'Usamos esta información para mostrar tu empresa y facilitar contactos reales con talento.')
const successEyebrow = computed(() => isCandidate.value ? 'JINOWORK · PERFIL DE POSTULANTE' : 'JINOWORK · PERFIL DE EMPRESA')
const successTitle = computed(() => isCandidate.value ? '¡Tu perfil ya está listo!' : '¡Tu empresa ya está lista!')
const successCopy = computed(() => isCandidate.value
  ? 'Ya puedes explorar oportunidades y postularte con la información que acabas de completar.'
  : 'Ya puedes publicar vacantes y empezar a recibir postulantes con la información que acabas de completar.')
const successHighlights = computed(() => isCandidate.value
  ? ['Datos personales listos', 'Ubicación y área profesional listas']
  : ['Empresa creada', 'Contacto y ubicación listos'])
const asideSteps = computed(() => isCandidate.value
  ? ['Datos personales', 'Perfil profesional', 'Confirmación']
  : ['Información básica', 'Ubicación y contacto', 'Confirmación'])

watch(() => form.departmentId, (departmentId, previous) => {
  if (departmentId !== previous && form.municipalityId && !filteredMunicipalities.value.some((item) => item.id === form.municipalityId)) {
    form.municipalityId = ''
    fieldErrors.municipalityId = ''
  }
})
watch(() => form.professionalAreaId, (areaId, previous) => {
  if (areaId !== previous && form.specializationId && !filteredSpecializations.value.some((item) => item.id === form.specializationId)) form.specializationId = ''
})

onMounted(async () => {
  try {
    const state = await authApi.getOnboarding()
    if (state.complete) {
      await router.replace('/')
      return
    }
    role.value = state.role
    accountEmail.value = state.email
    emailVerified.value = state.emailVerified
    step.value = state.step
    catalogs.value = state.catalogs
    fillForm(state.profile)
  } catch (error) {
    isError.value = true
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo cargar tu perfil.'
  } finally {
    loading.value = false
  }
})

function formatNicaraguaPhone(value: string | null | undefined): string {
  let digits = (value ?? '').replace(/\D/g, '')
  if (digits.startsWith('505') && digits.length === 11) digits = digits.slice(3)
  digits = digits.slice(0, 8)
  return digits.length > 4 ? digits.slice(0, 4) + ' ' + digits.slice(4) : digits
}
function onPhoneInput(event: Event) {
  form.phone = formatNicaraguaPhone((event.target as HTMLInputElement).value)
  fieldErrors.phone = ''
}
function fillForm(profile: OnboardingProfile | null) {
  if (!profile) return
  Object.assign(form, {
    firstName: profile.firstName ?? '', lastName: profile.lastName ?? '',
    phone: formatNicaraguaPhone(profile.phone), departmentId: profile.departmentId ?? '',
    municipalityId: profile.municipalityId ?? '', professionalAreaId: profile.professionalAreaId ?? '',
    specializationId: profile.specializationId ?? '', companyName: profile.name ?? '',
    description: profile.description ?? '', website: profile.website ?? '',
    economicSectorId: profile.economicSectorId ?? '', address: profile.address ?? '',
    contactEmail: profile.contactEmail ?? '',
  })
}
function stepData(): Record<string, unknown> {
  const nonEmpty = (value: string) => value.trim() || undefined
  if (isCandidate.value && step.value === 1) return {
    firstName: form.firstName.trim().replace(/\s+/g, ' '), lastName: form.lastName.trim().replace(/\s+/g, ' '),
    phone: '+505' + phoneDigits.value, departmentId: form.departmentId, municipalityId: form.municipalityId,
  }
  if (isCandidate.value && step.value === 2) return {
    professionalAreaId: form.professionalAreaId, specializationId: form.specializationId || null,
  }
  if (!isCandidate.value && step.value === 1) return {
    companyName: form.companyName.trim(), description: nonEmpty(form.description), website: nonEmpty(form.website),
    economicSectorId: form.economicSectorId || null,
  }
  if (!isCandidate.value && step.value === 2) return {
    departmentId: form.departmentId || null, municipalityId: form.municipalityId || null,
    address: nonEmpty(form.address), contactEmail: nonEmpty(form.contactEmail), phone: nonEmpty(form.phone),
  }
  return {}
}
function validateCurrentStep(): boolean {
  for (const key of Object.keys(fieldErrors) as (keyof typeof fieldErrors)[]) fieldErrors[key] = ''
  if (isCandidate.value && step.value === 1) {
    const pattern = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’\-]*$/u
    const firstName = form.firstName.trim().replace(/\s+/g, ' ')
    const lastName = form.lastName.trim().replace(/\s+/g, ' ')
    if (!firstName || firstName.length > 100 || !pattern.test(firstName)) fieldErrors.firstName = 'Ingresa un nombre válido (máximo 100 caracteres).'
    if (!lastName || lastName.length > 100 || !pattern.test(lastName)) fieldErrors.lastName = 'Ingresa apellidos válidos (máximo 100 caracteres).'
    if (!/^[2-9]\d{7}$/.test(phoneDigits.value)) fieldErrors.phone = 'Ingresa los 8 dígitos de un teléfono nicaragüense.'
    if (!form.departmentId) fieldErrors.departmentId = 'Selecciona tu departamento.'
    if (!form.municipalityId) fieldErrors.municipalityId = 'Selecciona tu municipio.'
  } else if (isCandidate.value && step.value === 2) {
    if (!form.professionalAreaId) fieldErrors.professionalAreaId = 'Selecciona tu área profesional.'
  } else if (!isCandidate.value && step.value === 1) {
    if (!form.companyName.trim()) fieldErrors.companyName = 'Ingresa el nombre de la empresa.'
    if (form.website.trim()) {
      try {
        const website = new URL(form.website.trim())
        if (!['http:', 'https:'].includes(website.protocol)) throw new Error()
      } catch { fieldErrors.website = 'Ingresa una dirección web válida que comience con https://.' }
    }
  } else if (!isCandidate.value && step.value === 2) {
    if (form.phone.trim() && !/^\+?[0-9()\s.-]{7,40}$/.test(form.phone.trim())) fieldErrors.phone = 'Ingresa un teléfono válido.'
    if (form.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) fieldErrors.contactEmail = 'Ingresa un correo válido.'
  }
  return !Object.values(fieldErrors).some(Boolean)
}
async function continueOnboarding() {
  if (saving.value || !validateCurrentStep()) return
  saving.value = true
  isError.value = false
  errorMessage.value = ''
  try {
    const result = await authApi.saveOnboardingStep(step.value, stepData())
    if (result.step === 4) {
      completed.value = true
      return
    }
    step.value = result.step
  } catch (error) {
    isError.value = true
    errorMessage.value = error instanceof Error ? error.message : 'No se pudieron guardar los cambios. Inténtalo de nuevo.'
  } finally {
    saving.value = false
  }
}
function previousStep() {
  if (saving.value || step.value <= 1) return
  step.value -= 1
  isError.value = false
  errorMessage.value = ''
}
function goHome() { void router.replace('/') }
function completeLater() { void router.push('/') }
</script>

<template>
  <main class="onboarding-page">
    <div class="onboarding-glow onboarding-glow--one" aria-hidden="true" />
    <div class="onboarding-glow onboarding-glow--two" aria-hidden="true" />
    <a class="onboarding-brand" href="/" aria-label="Jinowork, ir al inicio"><span class="onboarding-brand__mark">J</span><span>jinowork</span></a>

    <section v-if="loading" class="onboarding-loading" role="status" aria-live="polite">
      <span class="onboarding-loading__spinner" aria-hidden="true" /><p>Preparando tu perfil...</p>
    </section>
    <section v-else-if="completed" class="onboarding-success" aria-labelledby="success-title">
      <div class="onboarding-success__icon"><CircleCheck :size="36" :stroke-width="1.8" /></div>
      <p class="onboarding-eyebrow">{{ successEyebrow }}</p>
      <h1 id="success-title">{{ successTitle }}</h1>
      <p class="onboarding-success__copy">{{ successCopy }}</p>
      <div class="onboarding-success__summary">
        <span v-for="item in successHighlights" :key="item"><Check :size="17" /> {{ item }}</span>
      </div>
      <button class="onboarding-button onboarding-button--primary" type="button" @click="goHome">
        {{ isCandidate ? 'Explorar oportunidades' : 'Ir al panel principal' }} <ArrowRight :size="18" />
      </button>
    </section>

    <section v-else class="onboarding-workspace" :aria-busy="saving">
      <aside class="onboarding-aside">
        <div class="onboarding-aside__intro">
          <span class="onboarding-aside__icon"><UserRound :size="20" /></span>
          <p class="onboarding-eyebrow">PRIMEROS PASOS</p>
          <h1>{{ asideTitle }}</h1>
          <p>{{ asideDescription }}</p>
        </div>
        <ol class="onboarding-steps" aria-label="Pasos para completar el perfil">
          <li v-for="(label, index) in asideSteps" :key="label" :class="{ 'is-active': step === index + 1, 'is-complete': step > index + 1 }">
            <span class="onboarding-steps__number"><Check v-if="step > index + 1" :size="15" /><template v-else>{{ index + 1 }}</template></span><span>{{ label }}</span>
          </li>
        </ol>
        <div class="onboarding-aside__privacy"><ShieldCheck :size="17" /><span>{{ asidePrivacyText }}</span></div>
        <div class="onboarding-aside__decoration" aria-hidden="true"><span /><span /><span /></div>
      </aside>

      <div class="onboarding-panel">
        <header class="onboarding-panel__top">
          <span class="onboarding-panel__role"><BriefcaseBusiness :size="15" /> {{ isCandidate ? 'Perfil de postulante' : 'Perfil de empresa' }}</span>
          <span class="onboarding-panel__step">Paso {{ step }} <span>de 3</span></span>
        </header>
        <div class="onboarding-progress" role="progressbar" :aria-valuenow="step" aria-valuemin="1" aria-valuemax="3" :aria-label="'Paso ' + step + ' de 3'"><span :style="{ width: progressWidth }" /></div>
        <header class="onboarding-heading"><h2>{{ title }}</h2><p>{{ description }}</p></header>
        <AuthFeedback v-if="isError" :message="errorMessage" variant="error" @dismiss="isError = false" />

        <template v-if="isCandidate && step === 1">
          <div class="onboarding-account" :class="{ 'onboarding-account--unverified': !emailVerified }">
            <span class="onboarding-account__icon"><ShieldCheck :size="18" /></span>
            <span class="onboarding-account__copy"><small>Correo de tu cuenta</small><strong>{{ accountEmail }}</strong></span>
            <span class="onboarding-account__status">{{ emailVerified ? 'Verificado' : 'Pendiente' }}</span>
          </div>
          <p v-if="!emailVerified" class="onboarding-inline-alert" role="alert">Verifica este correo antes de completar tu perfil.</p>
          <div class="onboarding-fields">
            <label class="onboarding-field"><span>Nombre <b>*</b></span><input v-model="form.firstName" autocomplete="given-name" maxlength="100" required :aria-invalid="Boolean(fieldErrors.firstName)" :aria-describedby="fieldErrors.firstName ? 'first-name-error' : 'name-hint'" @input="fieldErrors.firstName = ''" /><small v-if="fieldErrors.firstName" id="first-name-error" class="onboarding-field__error" role="alert">{{ fieldErrors.firstName }}</small><small v-else id="name-hint" class="onboarding-field__hint">Como aparece en tu identificación.</small></label>
            <label class="onboarding-field"><span>Apellidos <b>*</b></span><input v-model="form.lastName" autocomplete="family-name" maxlength="100" required :aria-invalid="Boolean(fieldErrors.lastName)" :aria-describedby="fieldErrors.lastName ? 'last-name-error' : undefined" @input="fieldErrors.lastName = ''" /><small v-if="fieldErrors.lastName" id="last-name-error" class="onboarding-field__error" role="alert">{{ fieldErrors.lastName }}</small></label>
            <label class="onboarding-field onboarding-field--wide"><span>Teléfono de contacto <b>*</b></span><span class="onboarding-phone" :class="{ 'onboarding-phone--invalid': fieldErrors.phone }"><span class="onboarding-phone__prefix" aria-label="Código de país Nicaragua">🇳🇮 <b>+505</b></span><input :value="form.phone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="9" placeholder="8888 8888" required :aria-invalid="Boolean(fieldErrors.phone)" :aria-describedby="fieldErrors.phone ? 'phone-error' : 'phone-hint'" @input="onPhoneInput" /></span><small v-if="fieldErrors.phone" id="phone-error" class="onboarding-field__error" role="alert">{{ fieldErrors.phone }}</small><small v-else id="phone-hint" class="onboarding-field__hint">Escribe los 8 dígitos de tu número.</small></label>
            <label class="onboarding-field"><span>Departamento <b>*</b></span><select v-model="form.departmentId" required :aria-invalid="Boolean(fieldErrors.departmentId)" :aria-describedby="fieldErrors.departmentId ? 'department-error' : undefined"><option value="" disabled>Selecciona tu departamento</option><option v-for="department in catalogs.departments" :key="department.id" :value="department.id">{{ department.name }}</option></select><small v-if="fieldErrors.departmentId" id="department-error" class="onboarding-field__error" role="alert">{{ fieldErrors.departmentId }}</small></label>
            <label class="onboarding-field"><span>Municipio <b>*</b></span><select v-model="form.municipalityId" required :disabled="!form.departmentId" :aria-invalid="Boolean(fieldErrors.municipalityId)" :aria-describedby="fieldErrors.municipalityId ? 'municipality-error' : undefined"><option value="" disabled>{{ form.departmentId ? 'Selecciona tu municipio' : 'Primero elige un departamento' }}</option><option v-for="municipality in filteredMunicipalities" :key="municipality.id" :value="municipality.id">{{ municipality.name }}</option></select><small v-if="fieldErrors.municipalityId" id="municipality-error" class="onboarding-field__error" role="alert">{{ fieldErrors.municipalityId }}</small></label>
          </div>
          <p v-if="!catalogsReady" class="onboarding-catalog-alert" role="status">No se pudieron cargar los catálogos de ubicación y áreas. Actualiza la página o inténtalo de nuevo más tarde.</p>
        </template>

        <div v-else-if="isCandidate && step === 2" class="onboarding-fields">
          <label class="onboarding-field onboarding-field--wide"><span>Área profesional <b>*</b></span><select v-model="form.professionalAreaId" required :aria-invalid="Boolean(fieldErrors.professionalAreaId)" :aria-describedby="fieldErrors.professionalAreaId ? 'area-error' : 'area-hint'"><option value="" disabled>Selecciona el área que mejor te representa</option><option v-for="area in catalogs.professionalAreas" :key="area.id" :value="area.id">{{ area.name }}</option></select><small v-if="fieldErrors.professionalAreaId" id="area-error" class="onboarding-field__error" role="alert">{{ fieldErrors.professionalAreaId }}</small><small v-else id="area-hint" class="onboarding-field__hint">La usarás para descubrir oportunidades relacionadas.</small></label>
          <label class="onboarding-field onboarding-field--wide"><span>Especialización <small>Opcional</small></span><select v-model="form.specializationId" :disabled="!form.professionalAreaId || !filteredSpecializations.length"><option value="">{{ form.professionalAreaId ? 'Elige una especialización (opcional)' : 'Primero elige un área profesional' }}</option><option v-for="specialization in filteredSpecializations" :key="specialization.id" :value="specialization.id">{{ specialization.name }}</option></select><small class="onboarding-field__hint">Puedes agregar o cambiar este dato más adelante.</small></label>
          <div class="onboarding-tip"><MapPin :size="18" /><p>Tu ubicación y área nos ayudan a mostrarte vacantes adecuadas. No compartiremos tu teléfono públicamente.</p></div>
        </div>

        <dl v-else-if="step === 1" class="onboarding-fields">
          <label class="onboarding-field onboarding-field--wide"><span>Nombre de la empresa <b>*</b></span><input v-model="form.companyName" autocomplete="organization" maxlength="160" required :aria-invalid="Boolean(fieldErrors.companyName)" :aria-describedby="fieldErrors.companyName ? 'company-name-error' : undefined" @input="fieldErrors.companyName = ''" /><small v-if="fieldErrors.companyName" id="company-name-error" class="onboarding-field__error" role="alert">{{ fieldErrors.companyName }}</small></label>
          <label class="onboarding-field"><span>Sector económico <small>Opcional</small></span><select v-model="form.economicSectorId"><option value="">Selecciona un sector</option><option v-for="sector in catalogs.economicSectors" :key="sector.id" :value="sector.id">{{ sector.name }}</option></select></label>
          <label class="onboarding-field onboarding-field--wide"><span>Descripción <small>Opcional</small></span><textarea v-model="form.description" maxlength="5000" rows="3" /></label>
          <label class="onboarding-field onboarding-field--wide"><span>Sitio web <small>Opcional</small></span><input v-model="form.website" type="url" maxlength="2000" placeholder="https://empresa.com" :aria-invalid="Boolean(fieldErrors.website)" :aria-describedby="fieldErrors.website ? 'website-error' : undefined" @input="fieldErrors.website = ''" /><small v-if="fieldErrors.website" id="website-error" class="onboarding-field__error" role="alert">{{ fieldErrors.website }}</small></label>
        </dl>
        <div v-else-if="step === 2" class="onboarding-fields">
          <label class="onboarding-field"><span>Departamento <small>Opcional</small></span><select v-model="form.departmentId"><option value="">Selecciona un departamento</option><option v-for="department in catalogs.departments" :key="department.id" :value="department.id">{{ department.name }}</option></select></label>
          <label class="onboarding-field"><span>Municipio <small>Opcional</small></span><select v-model="form.municipalityId" :disabled="!form.departmentId"><option value="">Selecciona un municipio</option><option v-for="municipality in filteredMunicipalities" :key="municipality.id" :value="municipality.id">{{ municipality.name }}</option></select></label>
          <label class="onboarding-field onboarding-field--wide"><span>Dirección <small>Opcional</small></span><input v-model="form.address" autocomplete="street-address" maxlength="500" /></label>
          <label class="onboarding-field"><span>Correo de contacto <small>Opcional</small></span><input v-model="form.contactEmail" type="email" autocomplete="email" maxlength="254" :aria-invalid="Boolean(fieldErrors.contactEmail)" :aria-describedby="fieldErrors.contactEmail ? 'contact-email-error' : undefined" @input="fieldErrors.contactEmail = ''" /><small v-if="fieldErrors.contactEmail" id="contact-email-error" class="onboarding-field__error" role="alert">{{ fieldErrors.contactEmail }}</small></label>
          <label class="onboarding-field"><span>Teléfono <small>Opcional</small></span><input v-model="form.phone" type="tel" autocomplete="tel" maxlength="40" :aria-invalid="Boolean(fieldErrors.phone)" :aria-describedby="fieldErrors.phone ? 'company-phone-error' : undefined" @input="fieldErrors.phone = ''" /><small v-if="fieldErrors.phone" id="company-phone-error" class="onboarding-field__error" role="alert">{{ fieldErrors.phone }}</small></label>
        </div>

        <dl v-else class="onboarding-review">
          <div v-if="isCandidate" class="onboarding-review__identity"><span class="onboarding-review__avatar">{{ form.firstName.slice(0, 1).toUpperCase() }}{{ form.lastName.slice(0, 1).toUpperCase() }}</span><span><strong>{{ form.firstName }} {{ form.lastName }}</strong><small>{{ areaName }}</small></span></div>
          <div v-if="isCandidate"><dt>Correo de cuenta</dt><dd>{{ accountEmail }} <span class="onboarding-review__verified">Verificado</span></dd></div>
          <div v-if="isCandidate"><dt>Teléfono</dt><dd>+505 {{ phoneDigits.slice(0, 4) }} {{ phoneDigits.slice(4) }}</dd></div>
          <div v-if="isCandidate"><dt>Ubicación</dt><dd>{{ municipalityName }}, {{ departmentName }}</dd></div>
          <div v-if="isCandidate"><dt>Área profesional</dt><dd>{{ areaName }}</dd></div>
          <div v-if="isCandidate"><dt>Especialización</dt><dd>{{ specializationName || 'Aún sin especificar' }}</dd></div>
          <div v-if="!isCandidate"><dt>Empresa</dt><dd>{{ form.companyName }}</dd></div>
          <div v-if="!isCandidate"><dt>Sector</dt><dd>{{ catalogs.economicSectors?.find((item) => item.id === form.economicSectorId)?.name || 'Sin indicar' }}</dd></div>
          <div v-if="!isCandidate"><dt>Ubicación</dt><dd>{{ municipalityName || departmentName || 'Sin indicar' }}</dd></div>
          <div v-if="!isCandidate"><dt>Correo de contacto</dt><dd>{{ form.contactEmail || 'Sin indicar' }}</dd></div>
          <p v-if="isCandidate" class="onboarding-review__note">Podrás completar tu experiencia, estudios, idiomas y CV desde tu perfil.</p>
        </dl>

        <div class="onboarding-actions">
          <button v-if="step > 1" class="onboarding-button onboarding-button--back" type="button" :disabled="saving" @click="previousStep"><ArrowLeft :size="17" /> Atrás</button>
          <button class="onboarding-button onboarding-button--primary" type="button" :disabled="saving || (!catalogsReady) || (isCandidate && !emailVerified)" @click="continueOnboarding">
            <span>{{ saving ? 'Guardando perfil...' : step === 3 ? 'Crear mi perfil' : 'Guardar y continuar' }}</span><span v-if="saving" class="onboarding-button__spinner" aria-hidden="true" /><ArrowRight v-else :size="18" />
          </button>
        </div>
        <button v-if="!isCandidate" class="onboarding-later" type="button" :disabled="saving" @click="completeLater">Completar más tarde</button>
        <p class="onboarding-footnote"><ShieldCheck :size="14" /> Guardamos tu avance en cada paso.</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.onboarding-page{position:relative;isolation:isolate;display:flex;min-height:100vh;min-height:100dvh;align-items:stretch;justify-content:center;overflow:hidden;background:var(--background);color:var(--foreground)}
.onboarding-glow{position:absolute;z-index:-1;width:34rem;aspect-ratio:1;border-radius:50%;filter:blur(80px);opacity:.34;pointer-events:none}.onboarding-glow--one{top:-23rem;left:-12rem;background:#b9d9ff}.onboarding-glow--two{right:-20rem;bottom:-27rem;background:#d9c4ff}
.onboarding-brand{position:absolute;top:1.4rem;left:1.5rem;display:inline-flex;align-items:center;gap:.6rem;color:var(--foreground);font-family:Manrope,sans-serif;font-size:1.2rem;font-weight:850;letter-spacing:-.05em;z-index:2}.onboarding-brand__mark{display:grid;width:2rem;height:2rem;place-items:center;border-radius:.7rem;background:var(--primary);color:#fff;font-size:1rem;box-shadow:0 5px 14px color-mix(in srgb,var(--primary) 26%,transparent)}
.onboarding-workspace{display:grid;grid-template-columns:minmax(15.5rem,.78fr) minmax(0,1.35fr);width:100%;min-height:100vh;overflow:hidden;border:0;background:var(--surface);box-shadow:none}.onboarding-aside{position:relative;display:flex;flex-direction:column;min-height:100vh;overflow:hidden;padding:2.5rem 2rem;background:linear-gradient(148deg,#133e70 0%,#135fa7 56%,#247bd0 100%);color:#fff}.onboarding-aside__intro{position:relative;z-index:1}.onboarding-aside__icon{display:grid;width:2.7rem;height:2.7rem;margin-bottom:2.8rem;place-items:center;border:1px solid #ffffff38;border-radius:.9rem;background:#ffffff1f}.onboarding-eyebrow{margin:0 0 .8rem;color:#7fbaff;font-size:.69rem;font-weight:800;letter-spacing:.12em}.onboarding-aside .onboarding-eyebrow{color:#b9dcff}.onboarding-aside h1{max-width:15rem;margin:0 0 .85rem;font-family:Manrope,sans-serif;font-size:clamp(1.8rem,3vw,2.4rem);font-weight:800;letter-spacing:-.045em;line-height:1.1}.onboarding-aside__intro>p:last-child{max-width:16rem;margin:0;color:#ffffffbf;font-size:.92rem;line-height:1.6}
.onboarding-steps{position:relative;z-index:1;display:grid;gap:1.35rem;margin:3.2rem 0 auto;padding:0;list-style:none}.onboarding-steps li{display:flex;align-items:center;gap:.8rem;color:#ffffff91;font-size:.86rem;font-weight:600;transition:color .2s ease}.onboarding-steps li.is-active,.onboarding-steps li.is-complete{color:#fff}.onboarding-steps__number{display:grid;width:1.85rem;height:1.85rem;flex:0 0 auto;place-items:center;border:1px solid #ffffff52;border-radius:50%;font-size:.75rem}.onboarding-steps li.is-active .onboarding-steps__number{border-color:#fff;background:#fff;color:#155c9d;box-shadow:0 0 0 4px #ffffff26}.onboarding-steps li.is-complete .onboarding-steps__number{border-color:#a6e6cb;background:#a6e6cb;color:#174e44}.onboarding-aside__privacy{position:relative;z-index:1;display:flex;align-items:flex-start;gap:.6rem;margin-top:2rem;color:#ffffffb8;font-size:.73rem;line-height:1.5}.onboarding-aside__privacy svg{flex:0 0 auto;color:#b9dcff}.onboarding-aside__decoration{position:absolute;right:-3.5rem;bottom:-3.5rem;display:grid;width:16rem;aspect-ratio:1;place-items:center;border:1px solid #ffffff1a;border-radius:50%}.onboarding-aside__decoration span{grid-area:1/1;width:72%;aspect-ratio:1;border:1px solid #ffffff1f;border-radius:50%}.onboarding-aside__decoration span:nth-child(2){width:48%}.onboarding-aside__decoration span:nth-child(3){width:22%;background:#ffffff14}
.onboarding-panel{display:flex;flex-direction:column;justify-content:center;min-width:0;padding:clamp(2rem,5vw,4rem)}.onboarding-panel__top{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:.8rem}.onboarding-panel__role{display:inline-flex;align-items:center;gap:.45rem;color:var(--muted-foreground);font-size:.78rem;font-weight:700}.onboarding-panel__role svg{color:var(--primary)}.onboarding-panel__step{color:var(--foreground);font-size:.8rem;font-weight:750}.onboarding-panel__step span{color:var(--muted-foreground);font-weight:500}
.onboarding-progress{height:.28rem;margin-bottom:2.3rem;overflow:hidden;border-radius:99px;background:var(--panel)}.onboarding-progress span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--primary),#66a8ed);transition:width .35s ease}.onboarding-heading{margin-bottom:1.6rem}.onboarding-heading h2{margin:0 0 .5rem;font-family:Manrope,sans-serif;font-size:clamp(1.7rem,3vw,2.25rem);font-weight:800;letter-spacing:-.045em;line-height:1.15}.onboarding-heading p{max-width:33rem;margin:0;color:var(--muted-foreground);font-size:.91rem;line-height:1.55}
.onboarding-account{display:flex;align-items:center;gap:.75rem;margin:0 0 1.35rem;padding:.85rem 1rem;border:1px solid color-mix(in srgb,#1a9b6a 24%,var(--border));border-radius:.85rem;background:color-mix(in srgb,#e9f8f1 75%,var(--surface))}.onboarding-account--unverified{border-color:color-mix(in srgb,#b54708 30%,var(--border));background:color-mix(in srgb,#fff5e8 70%,var(--surface))}.onboarding-account__icon{display:grid;width:2.15rem;height:2.15rem;flex:0 0 auto;place-items:center;border-radius:.65rem;background:#1493621c;color:#16805b}.onboarding-account__copy{display:grid;min-width:0;gap:.15rem}.onboarding-account__copy small{color:var(--muted-foreground);font-size:.68rem}.onboarding-account__copy strong{overflow:hidden;color:var(--foreground);font-size:.83rem;text-overflow:ellipsis}.onboarding-account__status{margin-left:auto;color:#16805b;font-size:.68rem;font-weight:800;white-space:nowrap}.onboarding-account--unverified .onboarding-account__status{color:#a45108}.onboarding-inline-alert,.onboarding-catalog-alert{margin:-.7rem 0 1rem;color:#a45108;font-size:.78rem;line-height:1.45}.onboarding-catalog-alert{margin:1rem 0 0;padding:.75rem .9rem;border-radius:.65rem;background:color-mix(in srgb,#fff5e8 75%,var(--surface))}
.onboarding-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.05rem 1rem}.onboarding-field{display:grid;align-content:start;gap:.4rem;min-width:0;color:var(--foreground);font-size:.79rem;font-weight:700}.onboarding-field>span:first-child{display:flex;align-items:baseline;gap:.25rem}.onboarding-field b{color:#c24136}.onboarding-field>span:first-child small{color:var(--muted-foreground);font-size:.7rem;font-weight:500}.onboarding-field input,.onboarding-field select,.onboarding-phone{box-sizing:border-box;width:100%;min-height:3.1rem;border:1px solid var(--border);border-radius:.72rem;background:var(--surface);color:var(--foreground);font:inherit;font-size:.86rem;font-weight:450;transition:border-color .18s ease,box-shadow .18s ease,background-color .18s ease}.onboarding-field input,.onboarding-field select{padding:.72rem .85rem}.onboarding-field select{cursor:pointer}.onboarding-field input::placeholder{color:color-mix(in srgb,var(--muted-foreground) 67%,transparent)}.onboarding-field input:focus,.onboarding-field select:focus,.onboarding-phone:focus-within{border-color:var(--primary);outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 15%,transparent)}.onboarding-field [aria-invalid=true],.onboarding-phone--invalid{border-color:#c83d35}.onboarding-field select:disabled{cursor:not-allowed;background:var(--panel);color:var(--muted-foreground)}.onboarding-field--wide{grid-column:1/-1}.onboarding-field__hint,.onboarding-field__error{min-height:1em;color:var(--muted-foreground);font-size:.7rem;font-weight:450;line-height:1.4}.onboarding-field__error{color:#b42318}
.onboarding-phone{display:flex;align-items:center;overflow:hidden;padding-left:.8rem}.onboarding-phone__prefix{display:inline-flex;align-items:center;gap:.4rem;padding-right:.7rem;border-right:1px solid var(--border);color:var(--foreground);font-size:.8rem;white-space:nowrap}.onboarding-phone__prefix b{color:var(--foreground);font-size:.78rem}.onboarding-phone input{min-width:0;min-height:auto;flex:1;border:0;background:transparent;box-shadow:none!important}.onboarding-phone input:focus{outline:none}.onboarding-phone:focus-within{border-color:var(--primary)}.onboarding-phone--invalid{border-color:#c83d35}.onboarding-tip{display:flex;grid-column:1/-1;align-items:flex-start;gap:.65rem;margin-top:.2rem;padding:.8rem .9rem;border:1px solid var(--border);border-radius:.75rem;background:var(--panel);color:var(--muted-foreground)}.onboarding-tip svg{flex:0 0 auto;margin-top:.05rem;color:var(--primary)}.onboarding-tip p{margin:0;font-size:.76rem;line-height:1.5}
.onboarding-review{display:grid;margin:0;padding:.2rem 0 0}.onboarding-review>div:not(.onboarding-review__identity){display:grid;grid-template-columns:minmax(8rem,.65fr) minmax(0,1fr);gap:1rem;padding:.85rem 0;border-bottom:1px solid var(--border)}.onboarding-review dt{color:var(--muted-foreground);font-size:.78rem}.onboarding-review dd{display:flex;flex-wrap:wrap;align-items:center;gap:.4rem;min-width:0;margin:0;color:var(--foreground);font-size:.82rem;font-weight:650;overflow-wrap:anywhere}.onboarding-review__identity{display:flex;align-items:center;gap:.85rem;padding:.9rem 0 1.15rem}.onboarding-review__avatar{display:grid;width:3.2rem;height:3.2rem;flex:0 0 auto;place-items:center;border-radius:1rem;background:var(--secondary);color:var(--primary);font-family:Manrope,sans-serif;font-size:1rem;font-weight:800}.onboarding-review__identity>span:last-child{display:grid;gap:.25rem}.onboarding-review__identity strong{font-family:Manrope,sans-serif;font-size:1.1rem}.onboarding-review__identity small{color:var(--muted-foreground);font-size:.78rem}.onboarding-review__verified{padding:.2rem .45rem;border-radius:99px;background:#e8f7ef;color:#16744f;font-size:.65rem;font-weight:800}.onboarding-review__note{margin:1rem 0 0;padding:.8rem .9rem;border-radius:.7rem;background:var(--panel);color:var(--muted-foreground);font-size:.75rem;line-height:1.5}
.onboarding-actions{display:flex;gap:.7rem;margin-top:1.6rem}.onboarding-button{display:inline-flex;min-height:3.1rem;align-items:center;justify-content:center;gap:.65rem;padding:.7rem 1rem;border:1px solid transparent;border-radius:.75rem;font:inherit;font-size:.84rem;font-weight:750;cursor:pointer;transition:transform .16s ease,box-shadow .16s ease,background .16s ease}.onboarding-button:active:not(:disabled){transform:translateY(1px)}.onboarding-button:disabled{cursor:not-allowed;opacity:.55}.onboarding-button--primary{flex:1;background:var(--primary);color:#fff;box-shadow:0 7px 18px color-mix(in srgb,var(--primary) 22%,transparent)}.onboarding-button--primary:hover:not(:disabled){box-shadow:0 10px 22px color-mix(in srgb,var(--primary) 30%,transparent)}.onboarding-button--back{border-color:var(--border);background:var(--surface);color:var(--foreground)}.onboarding-button__spinner{width:1rem;height:1rem;border:2px solid #ffffff75;border-top-color:#fff;border-radius:50%;animation:onboard-spin .7s linear infinite}.onboarding-later{align-self:center;margin-top:.8rem;padding:.3rem;border:0;background:none;color:var(--muted-foreground);font:inherit;font-size:.77rem;text-decoration:underline;text-underline-offset:3px;cursor:pointer}.onboarding-footnote{display:flex;align-items:center;justify-content:center;gap:.4rem;margin:1rem 0 0;color:var(--muted-foreground);font-size:.69rem}.onboarding-footnote svg{color:var(--primary)}
.onboarding-loading,.onboarding-success{display:flex;width:min(100%,34rem);flex-direction:column;align-items:center;text-align:center}.onboarding-loading{gap:.9rem;color:var(--muted-foreground)}.onboarding-loading p{margin:0;font-size:.9rem}.onboarding-loading__spinner{width:2rem;height:2rem;border:3px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:onboard-spin .8s linear infinite}.onboarding-success{padding:clamp(2rem,6vw,4rem);border:1px solid var(--border);border-radius:1.5rem;background:var(--surface);box-shadow:0 28px 90px color-mix(in srgb,var(--foreground) 11%,transparent)}.onboarding-success__icon{display:grid;width:5rem;height:5rem;margin:0 0 1.5rem;place-items:center;border:1px solid #b8e8d2;border-radius:1.5rem;background:#ebf9f2;color:#18835c}.onboarding-success h1{margin:0 0 .65rem;font-family:Manrope,sans-serif;font-size:clamp(1.8rem,5vw,2.4rem);font-weight:850;letter-spacing:-.05em}.onboarding-success__copy{max-width:26rem;margin:0;color:var(--muted-foreground);font-size:.92rem;line-height:1.6}.onboarding-success__summary{display:grid;gap:.65rem;width:min(100%,21rem);margin:1.6rem 0;padding:1rem;border:1px solid var(--border);border-radius:.85rem;background:var(--panel);text-align:left}.onboarding-success__summary span{display:flex;align-items:center;gap:.55rem;color:var(--foreground);font-size:.78rem;font-weight:650}.onboarding-success__summary svg{color:#16805b}.onboarding-success .onboarding-button{width:min(100%,21rem)}
@keyframes onboard-spin{to{transform:rotate(360deg)}}
@media(max-width:760px){.onboarding-page{align-items:stretch;padding:0}.onboarding-brand{top:1rem;left:1rem}.onboarding-workspace{grid-template-columns:1fr;min-height:100dvh}.onboarding-aside{min-height:auto;padding:1.35rem 1.4rem 1.2rem}.onboarding-aside__icon{display:none}.onboarding-aside .onboarding-eyebrow{margin-bottom:.45rem}.onboarding-aside h1{max-width:none;margin-bottom:.4rem;font-size:1.45rem}.onboarding-aside__intro>p:last-child{max-width:none;font-size:.8rem}.onboarding-steps{display:flex;justify-content:space-between;gap:.5rem;margin:1.15rem 0 .2rem}.onboarding-steps li{gap:.4rem;font-size:.68rem}.onboarding-steps__number{width:1.55rem;height:1.55rem}.onboarding-aside__privacy,.onboarding-aside__decoration{display:none}.onboarding-panel{padding:1.5rem 1.3rem 1.35rem}.onboarding-progress{margin-bottom:1.6rem}.onboarding-heading{margin-bottom:1.25rem}.onboarding-heading h2{font-size:1.7rem}.onboarding-heading p{font-size:.84rem}}
@media(max-width:480px){.onboarding-page{padding-inline:.7rem}.onboarding-panel{padding-inline:1rem}.onboarding-fields{grid-template-columns:1fr;gap:.85rem}.onboarding-field--wide{grid-column:auto}.onboarding-steps li{flex-direction:column;align-items:center;gap:.3rem;text-align:center}.onboarding-review>div:not(.onboarding-review__identity){grid-template-columns:1fr;gap:.3rem}.onboarding-actions{gap:.5rem}.onboarding-button{padding-inline:.75rem;font-size:.79rem}.onboarding-review__note{font-size:.72rem}}
@media(prefers-reduced-motion:reduce){.onboarding-progress span,.onboarding-steps li,.onboarding-field input,.onboarding-field select,.onboarding-phone,.onboarding-button{transition:none}.onboarding-button__spinner,.onboarding-loading__spinner{animation:none}}
</style>
