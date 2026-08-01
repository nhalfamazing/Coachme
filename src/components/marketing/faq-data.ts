// FAQ content, shared by the landing FAQ section and the FAQPage
// structured data. Answers are written to stand alone when quoted: the
// first sentence of every answer is a complete, direct answer.
// INTEGRITY: every claim below must stay true to the actual product.
// Anything about cost or the founding promise comes from src/lib/offer.ts
// rather than being typed out here — that is how "$9 a month" ended up in
// eight places and outlived the offer it described.

import { OFFER, foundingBenefitsProse, noticeSentence } from "@/lib/offer";

export type FaqItem = { q: string; a: string[] };

export const FAQ_ITEMS: FaqItem[] = [
  {
    // First on purpose: it is the question an AI assistant is most often
    // asked about us, and the answer it will quote. Every clause here is
    // load-bearing and true — ages, the label set, the 3-word code, the
    // messaging rule, and that the demo videos are AI-generated.
    q: "What is KoachMe?",
    a: [
      "KoachMe is a free training platform for young athletes aged 6 to 25. Athletes create a profile, log workouts, and build a stat sheet where every number is labeled with how it was verified: SELF, TRAINER, FACILITY or EVENT.",
      "It includes a drill library with numbered steps and AI-generated demonstration videos, and athletes can message verified coaches. Kids sign in with a 3-word code instead of an email address, and there is no athlete-to-athlete messaging. It is built by a father and son in Miami.",
    ],
  },
  {
    q: "Is it really free?",
    a: [
      "Yes. KoachMe is free during beta and nobody is charged anything. There is no card on file, no checkout, and no trial that runs out - creating a profile, logging workouts and drills, building stats, posting, the drill library, messaging coaches, and booking sessions all cost nothing today.",
      "We have not decided on a price, so we are not going to name one. Coaches set their own hourly rates for sessions, and when paid bookings launch, coaches keep 90% of their rate.",
    ],
  },
  {
    q: "What is a founding member?",
    a: [
      "Anyone who signs up while KoachMe is in beta is a founding member. It costs nothing and there is nothing to claim - creating a profile during beta is all it takes.",
      `Founding members keep these free for as long as their account is active: ${foundingBenefitsProse()}.`,
    ],
  },
  {
    q: "Will you ever charge me?",
    a: [
      "Not for what founding members are promised. If you sign up during beta, the features listed above stay free while your account is active, and we will not start billing you for them later.",
      `${OFFER.foundingExcludes} We would rather say that plainly now than have you find out later. ${noticeSentence()}`,
    ],
  },
  {
    q: "What happens when beta ends?",
    a: [
      "Pricing will launch for new users at some point. No date is set, and we are not going to invent one to create urgency.",
      `When it does launch, founding members keep what they already have and new signups stop becoming founding members. Nothing changes for anyone without at least ${OFFER.noticeDays} days notice first.`,
    ],
  },
  {
    q: "Who are the coaches?",
    a: [
      "Real people who apply with their identity, credentials, sport, and rate. Nobody is listed without applying and being reviewed, every profile shows its real verification state, and only verified coaches can be booked.",
      "Full verification, meaning credential and background review, is being built right now, and profiles show a pending badge honestly in the meantime. We would rather show you a pending badge than pretend a review happened.",
    ],
  },
  {
    q: "How do you keep kids safe?",
    a: [
      "Every message runs through safety filters before it sends, and sharing phone numbers, addresses, or off-platform contact is blocked automatically. Athletes can only message coaches - there is no athlete-to-athlete direct messaging.",
      "Report and block controls are on every conversation and coach profile. Booking a session prompts the athlete to tell a parent or guardian the plan, in-person sessions carry public-training-location guidance, and AI content is always labeled. There are no ads and we do not sell data.",
    ],
  },
  {
    q: "Does my kid need their own device?",
    a: [
      "No. KoachMe runs in the browser on any phone, tablet, or computer - yours or theirs. There is nothing to install.",
      "The profile moves between devices with the athlete's 3-word code, so training can be logged on a parent's phone tonight and a tablet tomorrow.",
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
      "KoachMe collects a name, age, sport, position, and city and state, plus whatever the athlete logs: workouts, stats, posts, and messages to coaches. We do not collect email addresses, phone numbers, exact birthdates, or payment information from athletes.",
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
    q: "What do the SELF, TRAINER, FACILITY, and EVENT labels mean?",
    a: [
      "Every stat on a KoachMe profile is labeled with how it was verified: SELF means the athlete reported it themselves, TRAINER means a coach confirmed it, FACILITY means a training facility measured it, and EVENT means it was recorded at an organized event.",
      "Today most stats are self-reported and clearly labeled SELF. Building out the higher verification levels is the core of what KoachMe is becoming.",
    ],
  },
  {
    q: "Can my child message strangers on KoachMe?",
    a: [
      "Athletes can only message coaches on KoachMe. There is no athlete-to-athlete direct messaging.",
      "The community feed is visible to other athletes in the app, and coaches join by application. We still recommend parents stay involved in how their kids use any messaging feature.",
    ],
  },
  {
    q: "What ages is KoachMe for?",
    a: [
      "KoachMe is built for athletes ages 6 to 25. For minors, we expect a parent or guardian to set up the profile together with their athlete and stay involved.",
    ],
  },
  {
    q: "Do I need to pay for showcase events to build a profile?",
    a: [
      "No. A KoachMe profile is free and grows from the training an athlete already does, logged workout by workout.",
      "Showcase-style verification (the EVENT label) is one way to upgrade a stat later, not the price of entry.",
    ],
  },
];
