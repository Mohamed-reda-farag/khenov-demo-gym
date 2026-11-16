import type { Equipment, Exercise, MuscleGroup } from '../types';

function ex(
  id: string,
  ar: string,
  en: string,
  muscle: MuscleGroup,
  equipment: Equipment,
): Exercise {
  return { id, name: { ar, en }, muscle, equipment };
}

export const exercises: Exercise[] = [
  ex('bench-press', 'بنش برس بالبار', 'Barbell Bench Press', 'chest', 'barbell'),
  ex('incline-db-press', 'ضغط علوي بالدمبل', 'Incline Dumbbell Press', 'chest', 'dumbbell'),
  ex('push-up', 'تمرين الضغط', 'Push-Up', 'chest', 'bodyweight'),
  ex('cable-fly', 'فتح بالكابل', 'Cable Fly', 'chest', 'cable'),
  ex('dips', 'تمرين المتوازي', 'Dips', 'chest', 'bodyweight'),
  ex('deadlift', 'الرفعة الميتة', 'Deadlift', 'back', 'barbell'),
  ex('pull-up', 'عقلة', 'Pull-Up', 'back', 'bodyweight'),
  ex('barbell-row', 'تجديف بالبار', 'Barbell Row', 'back', 'barbell'),
  ex('lat-pulldown', 'سحب أمامي', 'Lat Pulldown', 'back', 'machine'),
  ex('seated-row', 'تجديف كابل جلوسًا', 'Seated Cable Row', 'back', 'cable'),
  ex('back-squat', 'سكوات بالبار', 'Back Squat', 'legs', 'barbell'),
  ex('leg-press', 'ضغط الأرجل', 'Leg Press', 'legs', 'machine'),
  ex('romanian-deadlift', 'رفعة ميتة رومانية', 'Romanian Deadlift', 'legs', 'barbell'),
  ex('walking-lunges', 'طعنات بالمشي', 'Walking Lunges', 'legs', 'dumbbell'),
  ex('calf-raise', 'رفع السمانة', 'Calf Raise', 'legs', 'machine'),
  ex('overhead-press', 'ضغط الكتف بالبار', 'Overhead Press', 'shoulders', 'barbell'),
  ex('lateral-raise', 'رفع جانبي', 'Lateral Raise', 'shoulders', 'dumbbell'),
  ex('face-pull', 'سحب الوجه', 'Face Pull', 'shoulders', 'cable'),
  ex('barbell-curl', 'كيرل بالبار', 'Barbell Curl', 'arms', 'barbell'),
  ex('hammer-curl', 'كيرل هامر', 'Hammer Curl', 'arms', 'dumbbell'),
  ex('triceps-pushdown', 'دفع الترايسبس بالكابل', 'Triceps Pushdown', 'arms', 'cable'),
  ex('plank', 'بلانك', 'Plank', 'core', 'bodyweight'),
  ex('hanging-leg-raise', 'رفع الأرجل معلّقًا', 'Hanging Leg Raise', 'core', 'bodyweight'),
  ex('russian-twist', 'التفاف روسي', 'Russian Twist', 'core', 'bodyweight'),
  ex('cable-crunch', 'طحن البطن بالكابل', 'Cable Crunch', 'core', 'cable'),
  ex('treadmill-intervals', 'فترات الجري', 'Treadmill Intervals', 'full_body', 'cardio'),
  ex('rowing-machine', 'جهاز التجديف', 'Rowing Machine', 'full_body', 'cardio'),
  ex('kettlebell-swing', 'أرجحة الكيتل بيل', 'Kettlebell Swing', 'full_body', 'kettlebell'),
  ex('burpees', 'بيربي', 'Burpees', 'full_body', 'bodyweight'),
  ex('jump-rope', 'نطّ الحبل', 'Jump Rope', 'full_body', 'cardio'),
];
