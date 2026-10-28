import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authApi, type OnboardingCatalogs, type OnboardingProfile } from '@/services/auth'

export function useOnboardingWizard() {
  const router = useRouter()
  const route = useRoute()
  const requestedRedirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') && !route.query.redirect.startsWith('//') ? route.query.redirect : ''
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
  const fieldErrors = reactive({
    firstName: '',
    lastName: '',
    phone: '',
    departmentId: '',
    municipalityId: '',
    professionalAreaId: '',
    companyName: '',
    website: '',
    contactEmail: '',
  })
  const form = reactive({
    firstName: '',
    lastName: '',
    phone: '',
    departmentId: '',
    municipalityId: '',
    professionalAreaId: '',
    specializationId: '',
    companyName: '',
    description: '',
    website: '',
    economicSectorId: '',
    address: '',
    contactEmail: '',
  })

  const isCandidate = computed(() => role.value === 'CANDIDATE')
  const filteredMunicipalities = computed(() =>
    catalogs.value.municipalities.filter((item) => item.departmentId === form.departmentId),
  )
  const filteredSpecializations = computed(
    () =>
      catalogs.value.specializations?.filter(
        (item) => item.professionalAreaId === form.professionalAreaId,
      ) ?? [],
  )
  const progressWidth = computed(() => (step.value / 3) * 100 + '%')
  const departmentName = computed(
    () => catalogs.value.departments.find((item) => item.id === form.departmentId)?.name ?? '',
  )
  const municipalityName = computed(
    () => filteredMunicipalities.value.find((item) => item.id === form.municipalityId)?.name ?? '',
  )
  const areaName = computed(
    () =>
      catalogs.value.professionalAreas?.find((item) => item.id === form.professionalAreaId)?.name ??
      '',
  )
  const specializationName = computed(
    () =>
      catalogs.value.specializations?.find((item) => item.id === form.specializationId)?.name ?? '',
  )
  const phoneDigits = computed(() => form.phone.replace(/\D/g, '').replace(/^505(?=\d{8}$)/, ''))
  const catalogsReady = computed(() =>
    isCandidate.value
      ? Boolean(
          catalogs.value.departments.length &&
          catalogs.value.municipalities.length &&
          catalogs.value.professionalAreas?.length,
        )
      : Boolean(
          catalogs.value.departments.length &&
          catalogs.value.municipalities.length &&
          catalogs.value.economicSectors?.length,
        ),
  )
  const title = computed(() =>
    step.value === 1
      ? isCandidate.value
        ? 'Empecemos con lo básico'
        : 'Cuéntanos sobre tu empresa'
      : step.value === 2
        ? isCandidate.value
          ? '¿A qué te dedicas?'
          : 'Ubicación y contacto'
        : isCandidate.value
          ? 'Revisa tu perfil'
          : 'Revisa los datos de tu empresa',
  )
  const description = computed(() =>
    step.value === 1
      ? isCandidate.value
        ? 'Usaremos estos datos para identificarte y ayudarte a encontrar oportunidades cerca de ti.'
        : 'Agrega la información básica de la organización.'
      : step.value === 2
        ? isCandidate.value
          ? 'Indica tu ubicación y área profesional para mostrarte empleos relevantes.'
          : 'Los datos de contacto serán independientes del correo con el que inicias sesión.'
        : 'Confirma que la información esté correcta. Podrás actualizarla desde tu perfil.',
  )
  const asideTitle = computed(() =>
    isCandidate.value
      ? 'Tu próxima oportunidad empieza aquí.'
      : 'Tu empresa empieza con una buena primera impresión.',
  )
  const asideDescription = computed(() =>
    isCandidate.value
      ? 'Completa tu perfil para que las empresas puedan conocerte mejor.'
      : 'Completa la información comercial y de contacto para que los candidatos te encuentren.',
  )
  const asidePrivacyText = computed(() =>
    isCandidate.value
      ? 'Tus datos se usan para crear tu perfil y conectar con empleos.'
      : 'Usamos esta información para mostrar tu empresa y facilitar contactos reales con talento.',
  )
  const successEyebrow = computed(() =>
    isCandidate.value ? 'JINOWORK · PERFIL DE POSTULANTE' : 'JINOWORK · PERFIL DE EMPRESA',
  )
  const successTitle = computed(() =>
    isCandidate.value ? '¡Tu perfil ya está listo!' : '¡Tu empresa ya está lista!',
  )
  const successCopy = computed(() =>
    isCandidate.value
      ? 'Ya puedes explorar oportunidades y postularte con la información que acabas de completar.'
      : 'Ya puedes publicar vacantes y empezar a recibir postulantes con la información que acabas de completar.',
  )
  const successHighlights = computed(() =>
    isCandidate.value
      ? ['Datos personales listos', 'Ubicación y área profesional listas']
      : ['Empresa creada', 'Contacto y ubicación listos'],
  )
  const asideSteps = computed(() =>
    isCandidate.value
      ? ['Datos personales', 'Perfil profesional', 'Confirmación']
      : ['Información básica', 'Ubicación y contacto', 'Confirmación'],
  )

  watch(
    () => form.departmentId,
    (departmentId, previous) => {
      if (
        departmentId !== previous &&
        form.municipalityId &&
        !filteredMunicipalities.value.some((item) => item.id === form.municipalityId)
      ) {
        form.municipalityId = ''
        fieldErrors.municipalityId = ''
      }
    },
  )
  watch(
    () => form.professionalAreaId,
    (areaId, previous) => {
      if (
        areaId !== previous &&
        form.specializationId &&
        !filteredSpecializations.value.some((item) => item.id === form.specializationId)
      )
        form.specializationId = ''
    },
  )

  onMounted(async () => {
    try {
      const state = await authApi.getOnboarding()
      if (state.complete) {
        await router.replace(requestedRedirect || (state.role === 'CANDIDATE' ? '/candidate' : '/company'))
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
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      phone: formatNicaraguaPhone(profile.phone),
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
    const nonEmpty = (value: string) => value.trim() || undefined
    if (isCandidate.value && step.value === 1)
      return {
        firstName: form.firstName.trim().replace(/\s+/g, ' '),
        lastName: form.lastName.trim().replace(/\s+/g, ' '),
        phone: '+505' + phoneDigits.value,
        departmentId: form.departmentId,
        municipalityId: form.municipalityId,
      }
    if (isCandidate.value && step.value === 2)
      return {
        professionalAreaId: form.professionalAreaId,
        specializationId: form.specializationId || null,
      }
    if (!isCandidate.value && step.value === 1)
      return {
        companyName: form.companyName.trim(),
        description: nonEmpty(form.description),
        website: nonEmpty(form.website),
        economicSectorId: form.economicSectorId || null,
      }
    if (!isCandidate.value && step.value === 2)
      return {
        departmentId: form.departmentId || null,
        municipalityId: form.municipalityId || null,
        address: nonEmpty(form.address),
        contactEmail: nonEmpty(form.contactEmail),
        phone: nonEmpty(form.phone),
      }
    return {}
  }
  function validateCurrentStep(): boolean {
    for (const key of Object.keys(fieldErrors) as (keyof typeof fieldErrors)[])
      fieldErrors[key] = ''
    if (isCandidate.value && step.value === 1) {
      const pattern = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u
      const firstName = form.firstName.trim().replace(/\s+/g, ' ')
      const lastName = form.lastName.trim().replace(/\s+/g, ' ')
      if (!firstName || firstName.length > 100 || !pattern.test(firstName))
        fieldErrors.firstName = 'Ingresa un nombre válido (máximo 100 caracteres).'
      if (!lastName || lastName.length > 100 || !pattern.test(lastName))
        fieldErrors.lastName = 'Ingresa apellidos válidos (máximo 100 caracteres).'
      if (!/^[2-9]\d{7}$/.test(phoneDigits.value))
        fieldErrors.phone = 'Ingresa los 8 dígitos de un teléfono nicaragüense.'
      if (!form.departmentId) fieldErrors.departmentId = 'Selecciona tu departamento.'
      if (!form.municipalityId) fieldErrors.municipalityId = 'Selecciona tu municipio.'
    } else if (isCandidate.value && step.value === 2) {
      if (!form.professionalAreaId)
        fieldErrors.professionalAreaId = 'Selecciona tu área profesional.'
    } else if (!isCandidate.value && step.value === 1) {
      if (!form.companyName.trim()) fieldErrors.companyName = 'Ingresa el nombre de la empresa.'
      if (form.website.trim()) {
        try {
          const website = new URL(form.website.trim())
          if (!['http:', 'https:'].includes(website.protocol)) throw new Error()
        } catch {
          fieldErrors.website = 'Ingresa una dirección web válida que comience con https://.'
        }
      }
    } else if (!isCandidate.value && step.value === 2) {
      if (form.phone.trim() && !/^\+?[0-9()\s.-]{7,40}$/.test(form.phone.trim()))
        fieldErrors.phone = 'Ingresa un teléfono válido.'
      if (form.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim()))
        fieldErrors.contactEmail = 'Ingresa un correo válido.'
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
      errorMessage.value =
        error instanceof Error
          ? error.message
          : 'No se pudieron guardar los cambios. Inténtalo de nuevo.'
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
  function goHome() {
    void router.replace(requestedRedirect || (isCandidate.value ? '/candidate' : '/company'))
  }
  function completeLater() {
    void router.push(requestedRedirect || (isCandidate.value ? '/candidate' : '/company'))
  }

  return {
    loading,
    saving,
    isError,
    errorMessage,
    accountEmail,
    emailVerified,
    completed,
    step,
    catalogs,
    fieldErrors,
    form,
    isCandidate,
    filteredMunicipalities,
    filteredSpecializations,
    progressWidth,
    departmentName,
    municipalityName,
    areaName,
    specializationName,
    phoneDigits,
    catalogsReady,
    title,
    description,
    asideTitle,
    asideDescription,
    asidePrivacyText,
    successEyebrow,
    successTitle,
    successCopy,
    successHighlights,
    asideSteps,
    onPhoneInput,
    continueOnboarding,
    previousStep,
    goHome,
    completeLater,
  }
}
