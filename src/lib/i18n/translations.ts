export type Lang = 'es' | 'en';

const es = {
  header: {
    howItWorks: '¿Cómo funciona?',
    aboutUs: 'Sobre nosotros',
    startFree: 'Empezá gratis',
  },
  hero: {
    headline1: '¿No te respetan',
    headline2: 'como consumidor?',
    subtitle: 'Entendé tus derechos como consumidor argentino y actuá de inmediato.',
    pillImmediate: 'Respuesta inmediata',
    pillConfidential: 'Confidencial',
    pillFree: 'Análisis gratis',
    ctaButton: 'Empezá tu diagnóstico gratis',
    ctaSubtext: 'Sin registro · Resultado en segundos',
    waLink: 'o escribinos por WhatsApp',
  },
  steps: {
    pill: 'El chatbot · Paso a paso',
    title: '¿Cómo funciona el diagnóstico?',
    subtitle:
      'Contanos tu caso en el chat y recibís un diagnóstico inicial en minutos. Sin tecnicismos, sin datos personales.',
    steps: [
      {
        title: 'Contanos tu problema',
        description: 'Escribí lo que pasó como si le contaras a un amigo. Sin tecnicismos.',
        time: '~1 min',
      },
      {
        title: 'Recibí un diagnóstico inicial',
        description:
          'La IA analiza tu caso y te explica qué opciones tenés. Es el primer paso antes del abogado.',
        time: '~2 min',
      },
      {
        title: 'Te conectamos con un abogado',
        description:
          'Si querés avanzar, un especialista revisa tu caso y te da el dictamen definitivo para actuar.',
        time: 'Mismo día',
      },
    ],
  },
  trust: {
    pill: '¿Por qué confiar en DefensaYa?',
    title: 'Tecnología legal, transparente y sin letra chica',
    signals: [
      { title: 'Ley 24.240', description: 'Diagnósticos basados en la Ley de Defensa del Consumidor vigente.' },
      { title: 'IA entrenada en legislación', description: 'Modelo entrenado con jurisprudencia y normativas de organismos oficiales argentinos.' },
      { title: 'Confidencial y seguro', description: 'Tu consulta no se almacena ni se comparte. Sin registro previo.' },
      { title: 'Respaldado por abogados', description: 'Cada diagnóstico puede ser revisado por profesionales matriculados.' },
      { title: 'Diagnóstico en minutos', description: 'Recibí una orientación legal inicial en menos de 3 minutos.' },
      { title: 'Sin costo ni compromiso', description: 'El diagnóstico inicial es 100% gratuito. Pagás solo si decidís avanzar.' },
    ],
  },
  info: {
    pill: 'Múltiples canales',
    title: 'Elegí cómo empezar',
    subtitle: 'Solo o con ayuda, respondemos en minutos.',
    aiTitle: 'Diagnóstico inicial con IA',
    aiBadge: 'Gratis',
    aiDesc: 'Resultado inmediato, sin datos, sin esperas.',
    waTitle: 'WhatsApp',
    waBadge: 'Recomendado',
    waDesc: 'Hablá directo con un abogado. Respondemos ya.',
    emailTitle: 'Email',
    emailDesc: 'Respondemos por escrito en el día.',
    formTitle: 'Dejá tus datos',
    formDesc: 'Completá el formulario y te llamamos.',
    waMessage: 'Hola! Tengo un problema de consumo y quiero orientacion',
    mailSubject: 'Consulta DefensaYa',
    mailBody: 'Hola, tengo un problema de consumo...',
    fabTooltipTitle: '¿Preferís WhatsApp?',
    fabTooltipDesc: 'Escribinos directo, respondemos en minutos.',
  },
  chat: {
    subtitle: 'Orientación gratuita al consumidor',
    online: 'En línea',
    live: 'En vivo',
    typing: 'DefensaYa está escribiendo',
    placeholder: 'Contame tu problema...',
    hintText: 'Escribí tu consulta acá · gratis y confidencial',
    welcome:
      '¡Hola! Soy DefensaYa 🤖 Contame qué problema tuviste con alguna empresa, banco o servicio, y te ayudo a entender qué podés hacer.',
    suggestions: [
      'Me cobraron de más en la tarjeta',
      'No respetan la garantía del producto',
      'Internet o celular no funciona y no me dan solución',
      'Cancelaron mi vuelo o viaje',
    ],
  },
  about: {
    pill: 'Quiénes somos',
    title: '¿Qué es QualifAI?',
    body: 'QualifAI es una plataforma de inteligencia artificial especializada en conectar personas con los profesionales adecuados para resolver su problema. Nuestra tecnología analiza cada caso de forma personalizada, califica la consulta y la deriva al especialista correcto a través del canal que el usuario prefiera — chat, WhatsApp, formulario o llamada. DefensaYA es nuestra primera solución vertical, enfocada en asesoramiento preliminar en Defensa del Consumidor en Argentina, combinando diagnóstico con inteligencia artificial y conexión directa con abogados reales a través de múltiples canales de atención.',
    stat1Value: '1ª',
    stat1Label: 'Plataforma que combina IA + omnicanalidad para conectar con abogados reales',
    stat2Value: '4',
    stat2Label: 'Canales de atención integrados',
    stat3Value: '100%',
    stat3Label: 'Diagnósticos sin almacenar datos personales',
    linkLabel: 'Conocé más sobre QualifAI',
  },
  footer: {
    tagline:
      'Orientación gratuita al consumidor argentino. Diagnóstico inmediato con IA, sin registro.',
    orgsHeading: 'Organismos',
    legalHeading: 'Marco Legal',
    legalLinksHeading: 'Legal',
    privacyPolicy: 'Política de privacidad',
    termsOfUse: 'Términos de uso',
    legalNotice: 'Aviso legal',
    disclaimerLabel: 'Aviso legal:',
    disclaimerText:
      'DefensaYa es un servicio de orientación automatizada y no constituye asesoramiento legal profesional. La información proporcionada es de carácter informativo y no reemplaza la consulta con un abogado matriculado.',
    copyright: 'Buenos Aires, Argentina',
  },
};

export type Translations = typeof es;

export const translations: Record<Lang, Translations> = {
  es,
  en: {
    header: {
      howItWorks: 'How it works',
      aboutUs: 'About us',
      startFree: 'Start free',
    },
    hero: {
      headline1: 'Is a company',
      headline2: 'ignoring your rights?',
      subtitle: 'Understand your consumer rights in Argentina and take action right away.',
      pillImmediate: 'Instant response',
      pillConfidential: 'Confidential',
      pillFree: 'Free analysis',
      ctaButton: 'Start your free diagnosis',
      ctaSubtext: 'No signup · Result in seconds',
      waLink: 'or message us on WhatsApp',
    },
    steps: {
      pill: 'The chatbot · Step by step',
      title: 'How does the diagnosis work?',
      subtitle:
        'Tell us your case and get an initial diagnosis in minutes. No jargon, no personal data required.',
      steps: [
        {
          title: 'Tell us your problem',
          description: 'Describe what happened as if explaining to a friend. No legal jargon.',
          time: '~1 min',
        },
        {
          title: 'Get an initial diagnosis',
          description:
            'The AI reviews your case and explains your options — a first step before hiring a lawyer.',
          time: '~2 min',
        },
        {
          title: "We'll connect you with a lawyer",
          description:
            'If you want to proceed, a specialist reviews your case and provides a professional opinion.',
          time: 'Same day',
        },
      ],
    },
    trust: {
      pill: 'Why trust DefensaYa?',
      title: 'Legal technology, transparent and clear',
      signals: [
        { title: 'Law 24.240', description: "Diagnoses based on Argentina's Consumer Protection Law." },
        { title: 'AI trained on legislation', description: 'Model trained on case law and regulations from official Argentine agencies.' },
        { title: 'Confidential & secure', description: 'Your query is never stored or shared. No prior registration required.' },
        { title: 'Backed by lawyers', description: 'Every diagnosis can be reviewed by a registered attorney.' },
        { title: 'Diagnosis in minutes', description: 'Get initial legal guidance in under 3 minutes.' },
        { title: 'No cost, no commitment', description: 'The initial diagnosis is 100% free. You only pay if you decide to proceed.' },
      ],
    },
    info: {
      pill: 'Multiple channels',
      title: 'Choose how to start',
      subtitle: 'On your own or with help, we respond in minutes.',
      aiTitle: 'Initial AI diagnosis',
      aiBadge: 'Free',
      aiDesc: 'Immediate result, no data required, no waiting.',
      waTitle: 'WhatsApp',
      waBadge: 'Recommended',
      waDesc: 'Talk directly with an advisor. We respond right away.',
      emailTitle: 'Email',
      emailDesc: 'We reply in writing within the day.',
      formTitle: 'Leave your details',
      formDesc: "Fill out the form and we'll call you.",
      waMessage: 'Hi! I have a consumer issue and need guidance',
      mailSubject: 'DefensaYa Inquiry',
      mailBody: 'Hello, I have a consumer issue...',
      fabTooltipTitle: 'Prefer WhatsApp?',
      fabTooltipDesc: 'Message us directly, we respond in minutes.',
    },
    chat: {
      subtitle: 'Free consumer guidance',
      online: 'Online',
      live: 'Live',
      typing: 'DefensaYa is typing',
      placeholder: 'Tell me your problem...',
      hintText: 'Type your question here · free & confidential',
      welcome:
        "Hi! I'm DefensaYa 🤖 Tell me what problem you had with a company, bank or service, and I'll help you understand what you can do.",
      suggestions: [
        'I was overcharged on my credit card',
        'My product warranty is not being honored',
        'Internet or phone service keeps failing',
        'My flight or trip was cancelled',
      ],
    },
    about: {
      pill: 'Who we are',
      title: 'What is QualifAI?',
      body: 'QualifAI is an artificial intelligence platform specialized in connecting people with the right professionals to solve their problem. Our technology analyzes each case in a personalized way, qualifies the inquiry and routes it to the correct specialist through the user\'s preferred channel — chat, WhatsApp, form or phone call. DefensaYA is our first vertical solution, focused on preliminary consumer rights advisory in Argentina, combining AI-powered diagnostics with direct connection to real lawyers through multiple support channels.',
      stat1Value: '1st',
      stat1Label: 'Platform combining AI + omnichannel to connect with real lawyers',
      stat2Value: '4',
      stat2Label: 'Integrated contact channels',
      stat3Value: '100%',
      stat3Label: 'Diagnoses with no personal data stored',
      linkLabel: 'Learn more about QualifAI',
    },
    footer: {
      tagline: 'Free consumer guidance for Argentina. Immediate AI diagnosis, no registration.',
      orgsHeading: 'Agencies',
      legalHeading: 'Legal Framework',
      legalLinksHeading: 'Legal',
      privacyPolicy: 'Privacy policy',
      termsOfUse: 'Terms of use',
      legalNotice: 'Legal notice',
      disclaimerLabel: 'Legal notice:',
      disclaimerText:
        'DefensaYa is an automated guidance service and does not constitute professional legal advice. The information provided is for general guidance only and does not replace consultation with a licensed attorney.',
      copyright: 'Buenos Aires, Argentina',
    },
  },
};
