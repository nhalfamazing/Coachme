// FAQ content, shared by the landing FAQ section and the FAQPage
// structured data. Answers are written to stand alone when quoted: the
// first sentence of every answer is a complete, direct answer.
// INTEGRITY: every claim below must stay true to the actual product.

export type FaqItem = { q: string; a: string[] };

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Is CoachMe free?",
    a: [
      "CoachMe is free for athletes. Creating a profile, logging workouts, watching drills, and messaging coaches costs nothing.",
      "Coaches set their own hourly rates for sessions. When paid bookings launch, coaches keep 90% of their rate.",
    ],
  },
  {
    q: "How does my kid log in without an email address?",
    a: [
      "Kids log in with a 3-word code like alex-tiger-moon instead of an email and password. The code is issued when the profile is created and works on any device.",
      "That means no email account, no password to forget, and one less online account tied to a child.",
    ],
  },
  {
    q: "What data do you collect about my child?",
    a: [
      "CoachMe collects a name, age, sport, position, and city and state, plus whatever the athlete logs: workouts, stats, posts, and messages to coaches. We do not collect email addresses, phone numbers, exact birthdates, or payment information from athletes.",
      "There are no ads and we do not sell data. The full details are in our privacy policy.",
    ],
  },
  {
    q: "Is the AI coach a real person?",
    a: [
      "No. The drill videos in the drill library are AI-generated demonstrations, and they are labeled AI COACH directly on the card so nobody mistakes them for a real trainer.",
      "Real, verified coaches review drill content as the platform grows. We label AI content everywhere it appears because trust matters more to us than polish.",
    ],
  },
  {
    q: "How do coaches get verified?",
    a: [
      "Every coach on CoachMe applies through our coach application and starts with a pending status. Full verification, meaning credential and background review, is being built right now, and coach profiles show their real verification state honestly in the meantime.",
      "We would rather show you a pending badge than pretend a review happened.",
    ],
  },
  {
    q: "What do the SELF, TRAINER, FACILITY, and EVENT labels mean?",
    a: [
      "Every stat on a CoachMe profile is labeled with how it was verified: SELF means the athlete reported it themselves, TRAINER means a coach confirmed it, FACILITY means a training facility measured it, and EVENT means it was recorded at an organized event.",
      "Today most stats are self-reported and clearly labeled SELF. Building out the higher verification levels is the core of what CoachMe is becoming.",
    ],
  },
  {
    q: "Can my child message strangers on CoachMe?",
    a: [
      "Athletes can only message coaches on CoachMe. There is no athlete-to-athlete direct messaging.",
      "The community feed is visible to other athletes in the app, and coaches join by application. We still recommend parents stay involved in how their kids use any messaging feature.",
    ],
  },
  {
    q: "What ages is CoachMe for?",
    a: [
      "CoachMe is built for athletes ages 6 to 25. For minors, we expect a parent or guardian to set up the profile together with their athlete and stay involved.",
    ],
  },
  {
    q: "Do I need to pay for showcase events to build a profile?",
    a: [
      "No. A CoachMe profile is free and grows from the training an athlete already does, logged workout by workout.",
      "Showcase-style verification (the EVENT label) is one way to upgrade a stat later, not the price of entry.",
    ],
  },
  {
    q: "What devices does CoachMe work on?",
    a: [
      "CoachMe runs in the browser on any phone, tablet, or computer. There is nothing to install, and a profile moves between devices with the athlete's 3-word code.",
    ],
  },
];
