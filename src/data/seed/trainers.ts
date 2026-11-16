import type { Trainer } from '../types';

export const trainers: Trainer[] = [
  {
    id: 'trainer-karim',
    name: { ar: 'كريم حسن', en: 'Karim Hassan' },
    specialty: { ar: 'القوة والرفع', en: 'Strength and lifting' },
    bio: {
      ar: 'مدرب قوة يركّز على الأساسيات والتدرّج الآمن في الأوزان.',
      en: 'A strength coach focused on fundamentals and safe, steady progression.',
    },
    yearsExperience: 9,
  },
  {
    id: 'trainer-salma',
    name: { ar: 'سلمى عادل', en: 'Salma Adel' },
    specialty: { ar: 'الهيت واليوغا والمرونة', en: 'HIIT, yoga and mobility' },
    bio: {
      ar: 'تجمع بين التمارين عالية الشدة والحركة الواعية لجسم أقوى وأكثر مرونة.',
      en: 'Blends high-intensity sessions with mindful movement for a stronger, more flexible body.',
    },
    yearsExperience: 7,
  },
  {
    id: 'trainer-omar',
    name: { ar: 'عمر فتحي', en: 'Omar Fathy' },
    specialty: { ar: 'الكارديو والملاكمة', en: 'Cardio and boxing' },
    bio: {
      ar: 'مدرب كارديو بطاقة عالية، يجعل الحصص ممتعة ومناسبة لكل المستويات.',
      en: 'A high-energy cardio coach who keeps sessions fun and suited to every level.',
    },
    yearsExperience: 6,
  },
];
