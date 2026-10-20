<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AuthFeedback from '@/components/auth/AuthFeedback.vue'
import { authApi, type OnboardingCatalogs, type OnboardingProfile } from '@/services/auth'

const router = useRouter()
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const isError = ref(false)
const savedMessage = ref('')
const fieldErrors = reactive({ firstName: '', lastName: '', companyName: '', phone: '', website: '', contactEmail: '' })
const role = ref<'CANDIDATE' | 'COMPANY'>('CANDIDATE')
const step = ref(1)
const catalogs = ref<OnboardingCatalogs>({ departments: [], municipalities: [] })

const form = reactive({
  firstName: '', lastName: '', phone: '', departmentId: '', municipalityId: '',
  professionalAreaId: '', specializationId: '',
  companyName: '', description: '', website: '', economicSectorId: '',
  address: '', contactEmail: '',
})

const isCandidate = computed(() => role.value === 'CANDIDATE')
const filteredMunicipalities = computed(() => catalogs.value.municipalities.filter(
  (municipality) => municipality.departmentId === form.departmentId,
))
const filteredSpecializations = computed(() => catalogs.value.specializations?.filter(
  (specialization) => specialization.professionalAreaId === form.professionalAreaId,
) ?? [])
const progressWidth = computed(() => `${(step.value / 3) * 100}%`)
const title = computed(() => {
  if (step.value === 1) return isCandidate.value ? 'Cuéntanos sobre ti' : 'Cuéntanos sobre tu empresa'
  if (step.value === 2) return isCandidate.value ? 'Tu perfil profesional' : 'Ubicación y contacto'
  return isCandidate.value ? 'Revisa tu perfil' : 'Revisa los datos de tu empresa'
})
const description = computed(() => {
  if (step.value === 1) return isCandidate.value
    ? 'Completa tus datos básicos para preparar tu perfil.'
    : 'Agrega la información básica de la organización.'
  if (step.value === 2) return isCandidate.value
    ? 'Estos datos ayudan a relacionar tu perfil con oportunidades relevantes.'
    : 'Los datos de contacto serán independientes del correo con el que inicias sesión.'
  return 'Confirma que la información guardada esté correcta para terminar.'
})

watch(() => form.departmentId, (departmentId, previous) => {
  if (departmentId !== previous && form.municipalityId && !filteredMunicipalities.value.some((item) => item.id === form.municipalityId)) {
    form.municipalityId = ''
  }
})
watch(() => form.professionalAreaId, (areaId, previous) => {
  if (areaId !== previous && form.specializationId && !filteredSpecializations.value.some((item) => item.id === form.specializationId)) {
    form.specializationId = ''
  }
})

onMounted(async () => {
  try {
    const state = await authApi.getOnboarding()
    if (state.complete) {
      await router.replace('/')
      return
    }
    role.value = state.role
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

function fillForm(profile: OnboardingProfile | null) {
  if (!profile) return
  Object.assign(form, {
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    phone: profile.phone ?? '',
    departmentId: profile.departmentId ?? '',
    municipalityId: profile.municipalityId ?? '',
    professionalAreaId: profile.professionalAreaId ?? '',
    specializationId: profile.specializationId ?? '',
    companyName: profile.name ?? '',
    description: profile.description ?? '',
    website: profile.website ?? '',
    economicSectorId: profile.economicSectorId ?? '',
    address: profile.address ?? '',
    contactEmail: profile.contactEmail ?? '',
  })
}

function stepData(): Record<string, unknown> {
  const nonEmpty = (value: string) => value.trim() ? value.trim() : undefined
  if (isCandidate.value && step.value === 1) {
    return {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: nonEmpty(form.phone),
      departmentId: form.departmentId || null,
      municipalityId: form.municipalityId || null,
    }
  }
  if (isCandidate.value && step.value === 2) {
    return {
      professionalAreaId: form.professionalAreaId || null,
      specializationId: form.specializationId || null,
    }
  }
  if (!isCandidate.value && step.value === 1) {
    return {
      companyName: form.companyName.trim(),
      description: nonEmpty(form.description),
      website: nonEmpty(form.website),
      economicSectorId: form.economicSectorId || null,
    }
  }
  if (!isCandidate.value && step.value === 2) {
    return {
      departmentId: form.departmentId || null,
      municipalityId: form.municipalityId || null,
      address: nonEmpty(form.address),
      contactEmail: nonEmpty(form.contactEmail),
      phone: nonEmpty(form.phone),
    }
  }
  return {}
}

async function continueOnboarding() {
  if (saving.value) return
  fieldErrors.phone = ''
  fieldErrors.website = ''
  fieldErrors.contactEmail = ''
  fieldErrors.firstName = step.value === 1 && isCandidate.value && !form.firstName.trim() ? 'Ingresa tu nombre.' : ''
  fieldErrors.lastName = step.value === 1 && isCandidate.value && !form.lastName.trim() ? 'Ingresa tus apellidos.' : ''
  fieldErrors.companyName = step.value === 1 && !isCandidate.value && !form.companyName.trim() ? 'Ingresa el nombre de la empresa.' : ''
  if ((step.value === 1 && isCandidate.value || step.value === 2 && !isCandidate.value) && form.phone.trim() && !/^\+?[0-9()\s.-]{7,40}$/.test(form.phone.trim())) {
    fieldErrors.phone = 'Ingresa un teléfono válido.'
  }
  if (step.value === 1 && !isCandidate.value && form.website.trim()) {
    try {
      const website = new URL(form.website.trim())
      if (!['http:', 'https:'].includes(website.protocol)) throw new Error()
    } catch {
      fieldErrors.website = 'Ingresa una dirección web válida.'
    }
  }
  if (step.value === 2 && !isCandidate.value && form.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
    fieldErrors.contactEmail = 'Ingresa un correo válido.'
  }
  if (Object.values(fieldErrors).some(Boolean)) return

  saving.value = true
  isError.value = false
  errorMessage.value = ''
  savedMessage.value = ''
  try {
    const result = await authApi.saveOnboardingStep(step.value, stepData())
    if (result.step === 4) {
      savedMessage.value = 'Perfil completado.'
      await router.replace('/')
      return
    }
    step.value = result.step
    savedMessage.value = 'Cambios guardados.'
  } catch (error) {
    isError.value = true
    errorMessage.value = error instanceof Error ? error.message : 'No se pudieron guardar los cambios.'
  } finally {
    saving.value = false
  }
}

function previousStep() {
  if (saving.value || step.value <= 1) return
  step.value -= 1
  savedMessage.value = ''
  errorMessage.value = ''
}

function completeLater() {
  void router.push('/')
}
</script>

<template>
  <main class="onboarding">
    <section class="onboarding__content" :aria-busy="loading || saving">
      <a class="onboarding__brand" href="/" aria-label="Jinowork, inicio">Jinowork</a>

      <template v-if="loading">
        <p class="onboarding__status" role="status">Cargando tu perfil...</p>
      </template>
      <template v-else>
        <div class="onboarding__progress" aria-label="Progreso de configuración">
          <div class="onboarding__progress-copy"><span>Paso {{ step }} de 3</span><span>{{ isCandidate ? 'Perfil de postulante' : 'Perfil de empresa' }}</span></div>
          <div class="onboarding__track"><span :style="{ width: progressWidth }" /></div>
        </div>

        <header class="onboarding__heading">
          <h1>{{ title }}</h1>
          <p>{{ description }}</p>
        </header>

        <div v-if="step === 1 && isCandidate" class="onboarding__fields">
          <label class="onboarding__field">
            <span>Nombre <b aria-hidden="true">*</b></span>
            <input v-model="form.firstName" autocomplete="given-name" maxlength="100" required :aria-invalid="Boolean(fieldErrors.firstName)" :aria-describedby="fieldErrors.firstName ? 'first-name-error' : undefined" @input="fieldErrors.firstName = ''" />
            <small v-if="fieldErrors.firstName" id="first-name-error" class="onboarding__field-error" role="alert">{{ fieldErrors.firstName }}</small>
          </label>
          <label class="onboarding__field">
            <span>Apellidos <b aria-hidden="true">*</b></span>
            <input v-model="form.lastName" autocomplete="family-name" maxlength="100" required :aria-invalid="Boolean(fieldErrors.lastName)" :aria-describedby="fieldErrors.lastName ? 'last-name-error' : undefined" @input="fieldErrors.lastName = ''" />
            <small v-if="fieldErrors.lastName" id="last-name-error" class="onboarding__field-error" role="alert">{{ fieldErrors.lastName }}</small>
          </label>
          <label class="onboarding__field">
            <span>Teléfono <small>Opcional</small></span>
            <input v-model="form.phone" autocomplete="tel" maxlength="40" type="tel" :aria-invalid="Boolean(fieldErrors.phone)" :aria-describedby="fieldErrors.phone ? 'candidate-phone-error' : undefined" @input="fieldErrors.phone = ''" />
            <small v-if="fieldErrors.phone" id="candidate-phone-error" class="onboarding__field-error" role="alert">{{ fieldErrors.phone }}</small>
          </label>
          <label class="onboarding__field">
            <span>Departamento <small>Opcional</small></span>
            <select v-model="form.departmentId">
              <option value="">Selecciona un departamento</option>
              <option v-for="department in catalogs.departments" :key="department.id" :value="department.id">{{ department.name }}</option>
            </select>
          </label>
          <label class="onboarding__field">
            <span>Municipio <small>Opcional</small></span>
            <select v-model="form.municipalityId" :disabled="!form.departmentId">
              <option value="">Selecciona un municipio</option>
              <option v-for="municipality in filteredMunicipalities" :key="municipality.id" :value="municipality.id">{{ municipality.name }}</option>
            </select>
          </label>
        </div>

        <div v-else-if="step === 2 && isCandidate" class="onboarding__fields">
          <label class="onboarding__field">
            <span>Área profesional <small>Opcional</small></span>
            <select v-model="form.professionalAreaId">
              <option value="">Selecciona un área</option>
              <option v-for="area in catalogs.professionalAreas" :key="area.id" :value="area.id">{{ area.name }}</option>
            </select>
          </label>
          <label class="onboarding__field">
            <span>Especialización <small>Opcional</small></span>
            <select v-model="form.specializationId" :disabled="!form.professionalAreaId">
              <option value="">Selecciona una especialización</option>
              <option v-for="specialization in filteredSpecializations" :key="specialization.id" :value="specialization.id">{{ specialization.name }}</option>
            </select>
          </label>
          <p v-if="catalogs.professionalAreas?.length === 0" class="onboarding__note">No hay áreas profesionales disponibles todavía. Puedes continuar y completarlo más tarde.</p>
        </div>

        <div v-else-if="step === 1" class="onboarding__fields">
          <label class="onboarding__field">
            <span>Nombre de la empresa <b aria-hidden="true">*</b></span>
            <input v-model="form.companyName" autocomplete="organization" maxlength="160" required :aria-invalid="Boolean(fieldErrors.companyName)" :aria-describedby="fieldErrors.companyName ? 'company-name-error' : undefined" @input="fieldErrors.companyName = ''" />
            <small v-if="fieldErrors.companyName" id="company-name-error" class="onboarding__field-error" role="alert">{{ fieldErrors.companyName }}</small>
          </label>
          <label class="onboarding__field">
            <span>Sector económico <small>Opcional</small></span>
            <select v-model="form.economicSectorId">
              <option value="">Selecciona un sector</option>
              <option v-for="sector in catalogs.economicSectors" :key="sector.id" :value="sector.id">{{ sector.name }}</option>
            </select>
          </label>
          <label class="onboarding__field onboarding__field--wide">
            <span>Descripción <small>Opcional</small></span>
            <textarea v-model="form.description" maxlength="5000" rows="4" />
          </label>
          <label class="onboarding__field onboarding__field--wide">
            <span>Sitio web <small>Opcional</small></span>
            <input v-model="form.website" type="url" maxlength="2000" placeholder="https://" :aria-invalid="Boolean(fieldErrors.website)" :aria-describedby="fieldErrors.website ? 'website-error' : undefined" @input="fieldErrors.website = ''" />
            <small v-if="fieldErrors.website" id="website-error" class="onboarding__field-error" role="alert">{{ fieldErrors.website }}</small>
          </label>
        </div>

        <div v-else-if="step === 2" class="onboarding__fields">
          <label class="onboarding__field">
            <span>Departamento <small>Opcional</small></span>
            <select v-model="form.departmentId">
              <option value="">Selecciona un departamento</option>
              <option v-for="department in catalogs.departments" :key="department.id" :value="department.id">{{ department.name }}</option>
            </select>
          </label>
          <label class="onboarding__field">
            <span>Municipio <small>Opcional</small></span>
            <select v-model="form.municipalityId" :disabled="!form.departmentId">
              <option value="">Selecciona un municipio</option>
              <option v-for="municipality in filteredMunicipalities" :key="municipality.id" :value="municipality.id">{{ municipality.name }}</option>
            </select>
          </label>
          <label class="onboarding__field onboarding__field--wide">
            <span>Dirección <small>Opcional</small></span>
            <input v-model="form.address" autocomplete="street-address" maxlength="500" />
          </label>
          <label class="onboarding__field">
            <span>Correo de contacto <small>Opcional</small></span>
            <input v-model="form.contactEmail" type="email" autocomplete="email" maxlength="254" :aria-invalid="Boolean(fieldErrors.contactEmail)" :aria-describedby="fieldErrors.contactEmail ? 'contact-email-error' : undefined" @input="fieldErrors.contactEmail = ''" />
            <small v-if="fieldErrors.contactEmail" id="contact-email-error" class="onboarding__field-error" role="alert">{{ fieldErrors.contactEmail }}</small>
          </label>
          <label class="onboarding__field">
            <span>Teléfono <small>Opcional</small></span>
            <input v-model="form.phone" type="tel" autocomplete="tel" maxlength="40" :aria-invalid="Boolean(fieldErrors.phone)" :aria-describedby="fieldErrors.phone ? 'company-phone-error' : undefined" @input="fieldErrors.phone = ''" />
            <small v-if="fieldErrors.phone" id="company-phone-error" class="onboarding__field-error" role="alert">{{ fieldErrors.phone }}</small>
          </label>
        </div>

        <dl v-else class="onboarding__review">
          <template v-if="isCandidate">
            <div><dt>Nombre</dt><dd>{{ form.firstName }} {{ form.lastName }}</dd></div>
            <div><dt>Ubicación</dt><dd>{{ catalogs.municipalities.find((item) => item.id === form.municipalityId)?.name || catalogs.departments.find((item) => item.id === form.departmentId)?.name || 'Sin indicar' }}</dd></div>
            <div><dt>Área profesional</dt><dd>{{ catalogs.professionalAreas?.find((item) => item.id === form.professionalAreaId)?.name || 'Sin indicar' }}</dd></div>
            <div><dt>Especialización</dt><dd>{{ catalogs.specializations?.find((item) => item.id === form.specializationId)?.name || 'Sin indicar' }}</dd></div>
          </template>
          <template v-else>
            <div><dt>Empresa</dt><dd>{{ form.companyName }}</dd></div>
            <div><dt>Sector</dt><dd>{{ catalogs.economicSectors?.find((item) => item.id === form.economicSectorId)?.name || 'Sin indicar' }}</dd></div>
            <div><dt>Ubicación</dt><dd>{{ catalogs.municipalities.find((item) => item.id === form.municipalityId)?.name || catalogs.departments.find((item) => item.id === form.departmentId)?.name || 'Sin indicar' }}</dd></div>
            <div><dt>Correo de contacto</dt><dd>{{ form.contactEmail || 'Sin indicar' }}</dd></div>
          </template>
        </dl>

        <AuthFeedback v-if="errorMessage" :message="errorMessage" variant="error" @dismiss="errorMessage = ''" />
        <p v-if="savedMessage" class="onboarding__saved" role="status">{{ savedMessage }}</p>

        <div class="onboarding__actions">
          <button v-if="step > 1" type="button" class="onboarding__secondary" :disabled="saving" @click="previousStep">Atrás</button>
          <button type="button" class="onboarding__primary" :disabled="saving" @click="continueOnboarding">
            {{ saving ? 'Guardando...' : step === 3 ? 'Finalizar' : 'Guardar y continuar' }}
          </button>
        </div>
        <button type="button" class="onboarding__later" :disabled="saving" @click="completeLater">Completar más tarde</button>
      </template>
    </section>
  </main>
</template>

<style scoped>
.onboarding { display: grid; min-height: 100vh; min-height: 100dvh; place-items: center; padding: 2rem 1.25rem; background: var(--background); color: var(--foreground); }
.onboarding__content { width: min(100%, 42rem); display: flex; flex-direction: column; gap: 1.5rem; }
.onboarding__brand { align-self: flex-start; color: var(--primary); font-family: Manrope, sans-serif; font-size: 1.25rem; font-weight: 800; }
.onboarding__progress-copy { display: flex; justify-content: space-between; gap: 1rem; margin-bottom: 0.55rem; color: var(--muted-foreground); font-size: 0.82rem; }
.onboarding__track { height: 4px; overflow: hidden; border-radius: 99px; background: var(--border); }
.onboarding__track span { display: block; height: 100%; border-radius: inherit; background: var(--primary); transition: width 0.2s ease; }
.onboarding__heading h1 { margin: 0 0 0.45rem; font-family: Manrope, sans-serif; font-size: clamp(1.65rem, 5vw, 2.25rem); }
.onboarding__heading p, .onboarding__note, .onboarding__status { margin: 0; color: var(--muted-foreground); line-height: 1.6; }
.onboarding__fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.onboarding__field { display: grid; align-content: start; gap: 0.45rem; min-width: 0; color: var(--foreground); font-size: 0.88rem; font-weight: 600; }
.onboarding__field small { margin-left: 0.3rem; color: var(--muted-foreground); font-size: 0.75rem; font-weight: 400; }
.onboarding__field b { color: var(--primary); }
.onboarding__field-error { color: #b42318 !important; font-size: 0.78rem !important; }
.onboarding__field input[aria-invalid="true"] { border-color: #b42318; }
.onboarding__field input, .onboarding__field select, .onboarding__field textarea { width: 100%; min-height: 2.9rem; padding: 0.7rem 0.8rem; border: 1px solid var(--border); border-radius: 0.55rem; background: var(--surface); color: var(--foreground); font: inherit; font-weight: 400; }
.onboarding__field textarea { resize: vertical; }
.onboarding__field input:focus-visible, .onboarding__field select:focus-visible, .onboarding__field textarea:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.onboarding__field select:disabled { opacity: 0.6; }
.onboarding__field--wide { grid-column: 1 / -1; }
.onboarding__note { grid-column: 1 / -1; font-size: 0.85rem; }
.onboarding__review { display: grid; gap: 0; margin: 0; border-top: 1px solid var(--border); }
.onboarding__review div { display: grid; grid-template-columns: minmax(8rem, 0.7fr) 1fr; gap: 1rem; padding: 0.8rem 0; border-bottom: 1px solid var(--border); }
.onboarding__review dt { color: var(--muted-foreground); }
.onboarding__review dd { margin: 0; font-weight: 600; }
.onboarding__actions { display: flex; gap: 0.75rem; }
.onboarding__primary, .onboarding__secondary { min-height: 3rem; padding: 0.7rem 1.2rem; border-radius: 999px; font: inherit; font-weight: 700; cursor: pointer; }
.onboarding__primary { flex: 1; border: 0; background: var(--primary); color: white; }
.onboarding__secondary { border: 1px solid var(--border); background: var(--surface); color: var(--foreground); }
.onboarding button:disabled { cursor: wait; opacity: 0.65; }
.onboarding__later { align-self: center; padding: 0.3rem; border: 0; background: none; color: var(--muted-foreground); font: inherit; font-size: 0.85rem; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
.onboarding__saved { margin: 0; color: var(--muted-foreground); font-size: 0.85rem; }
@media (max-width: 600px) { .onboarding__fields { grid-template-columns: 1fr; } .onboarding__field--wide, .onboarding__note { grid-column: auto; } .onboarding__review div { grid-template-columns: 1fr; gap: 0.25rem; } }
@media (prefers-reduced-motion: reduce) { .onboarding__track span { transition: none; } }
</style>
