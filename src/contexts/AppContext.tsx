import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ar' | 'en';
type Theme = 'light' | 'dark';

interface AppContextType {
  language: Language;
  theme: Theme;
  toggleLanguage: () => void;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Load from localStorage or default to Arabic
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'ar';
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as Theme) || 'light';
  });

  // Save to localStorage and apply theme class
  useEffect(() => {
    localStorage.setItem('app-language', language);
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    document.body.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
  }, [language]);

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    const root = document.documentElement;
    const body = document.body;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
  }, [theme]);

  const toggleLanguage = () => {
    setLanguageState(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Translation function (will be imported from translations file)
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const value: AppContextType = {
    language,
    theme,
    toggleLanguage,
    toggleTheme,
    setLanguage,
    setTheme,
    t,
    dir
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Translations object
const translations: Record<Language, Record<string, string>> = {
  ar: {
    // App name
    'app.name': 'سلامتك',
    'app.tagline': 'مستقبل الرعاية الصحية الرقمية',
    'app.description': 'منصة طبية متكاملة تجمع بين الأطباء والمرضى بتقنيات حديثة وتجربة استثنائية',
    
    // User types
    'user.patient': 'أنا مريض',
    'user.doctor': 'أنا طبيب',
    'patient.subtitle': 'رعاية صحية شاملة في راحة منزلك',
    'doctor.subtitle': 'منصة احترافية لإدارة عيادتك الطبية',
    
    // Actions
    'action.start': 'ابدأ رحلتك الصحية',
    'action.join': 'انضم لفريقنا الطبي',
    'action.login': 'تسجيل الدخول',
    'action.logout': 'تسجيل الخروج',
    'action.back': 'عودة',
    'action.save': 'حفظ',
    'action.cancel': 'إلغاء',
    'action.submit': 'إرسال',
    'action.edit': 'تعديل',
    'action.delete': 'حذف',
    'action.search': 'بحث',
    'action.filter': 'تصفية',
    'action.add': 'إضافة',
    'action.remove': 'إزالة',
    
    // Features - Patient
    'feature.appointments': 'حجز مواعيد',
    'feature.health.tracking': 'متابعة صحية',
    'feature.medication.reminder': 'تذكير أدوية',
    'feature.video.consultation': 'استشارات مرئية',
    
    // Features - Doctor
    'feature.patient.management': 'إدارة مرضى',
    'feature.digital.prescription': 'روشتات رقمية',
    'feature.schedule': 'جدولة مواعيد',
    'feature.remote.consultation': 'استشارات عن بُعد',
    
    // Main Features
    'main.feature.comprehensive': 'رعاية شاملة',
    'main.feature.comprehensive.desc': 'متابعة طبية كاملة من التشخيص إلى العلاج',
    'main.feature.secure': 'أمان مطلق',
    'main.feature.secure.desc': 'حماية كاملة للبيانات الطبية والشخصية',
    'main.feature.available': 'متاح دائماً',
    'main.feature.available.desc': 'خدمات طبية متاحة 24/7 من أي مكان',
    
    // Stats
    'stats.doctors': 'طبيب مختص',
    'stats.patients': 'مريض راضي',
    'stats.consultations': 'استشارة طبية',
    'stats.satisfaction': 'نسبة الرضا',
    
    // Dashboard
    'dashboard.welcome': 'مرحباً',
    'dashboard.patient': 'لوحة المريض',
    'dashboard.doctor': 'لوحة الطبيب',
    'dashboard.overview': 'نظرة عامة',
    'dashboard.appointments': 'المواعيد',
    'dashboard.patients': 'المرضى',
    'dashboard.prescriptions': 'الروشتات',
    'dashboard.consultations': 'الاستشارات',
    'dashboard.statistics': 'الإحصائيات',
    
    // Pages
    'page.prescription': 'كتابة روشتة طبية',
    'page.appointment': 'حجز موعد',
    'page.medication': 'تذكير الأدوية',
    'page.pharmacy': 'طلب أدوية',
    'page.video': 'استشارة مرئية',
    'page.rating': 'التقييمات والمراجعات',
    'page.profile': 'الملف الشخصي',
    'page.files': 'ملفات المرضى',
    
    // Settings
    'settings.language': 'اللغة',
    'settings.theme': 'الوضع',
    'settings.light': 'فاتح',
    'settings.dark': 'داكن',
    'settings.arabic': 'العربية',
    'settings.english': 'English',
    
    // Login
    'login.title': 'تسجيل الدخول',
    'doctor.login.title': 'تسجيل دخول الطبيب',
    'login.email': 'البريد الإلكتروني',
    'login.password': 'كلمة المرور',
    'login.phone': 'رقم الهاتف',
    'login.remember': 'تذكرني',
    'login.forgot': 'نسيت كلمة المرور؟',
    'login.welcome': 'مرحباً بك',
    'login.continue': 'متابعة',
    'login.submit': 'تسجيل الدخول',
    
    // Register
    'register.name': 'الاسم الكامل',
    'register.name.placeholder': 'أدخل اسمك الكامل',
    'register.phone': 'رقم الهاتف',
    'register.email': 'عنوان البريد الإروني',
    'register.birthdate': 'تاريخ الميلاد',
    'register.password': 'كلمة المرور',
    'register.confirmPassword': 'تأكيد كلمة المرور',
    'register.submit': 'تسجيل',
    
    // Common
    'common.doctor': 'طبيب',
    'common.patient': 'مريض',
    'common.appointment': 'موعد',
    'common.prescription': 'روشتة',
    'common.medication': 'دواء',
    'common.diagnosis': 'تشخيص',
    'common.treatment': 'علاج',
    'common.report': 'تقرير',
    'common.notes': 'ملاحظات',
    'common.date': 'التاريخ',
    'common.time': 'الوقت',
    'common.status': 'الحالة',
    'common.active': 'نشط',
    'common.inactive': 'غير نشط',
    'common.pending': 'قيد الانتظار',
    'common.completed': 'مكتمل',
    'common.cancelled': 'ملغى',
    
    // Default names
    'default.patient.name': 'اسامه رضا رافت',
    'default.doctor.name': 'د. مختار نبيل',
    'default.doctor2.name': 'د. مؤمن اسماعيل',
    'default.doctor3.name': 'د. محمد علاء',
    
    // Currency
    'currency': 'جنيه مصري',
    'currency.short': 'ج.م',
    
    // Dashboard - Doctor specific
    'doctor.dashboard.title': 'لوحة الطبيب',
    'doctor.dashboard.today.appointments': 'مواعيد اليوم',
    'doctor.dashboard.upcoming': 'مواعيد قادمة',
    'doctor.dashboard.patient.files': 'ملفات المرضى',
    'doctor.dashboard.statistics': 'الإحصائيات',
    'doctor.dashboard.total.patients': 'إجمالي المرضى',
    'doctor.dashboard.today.appointments.count': 'مواعيد اليوم',
    'doctor.dashboard.video.consultations': 'استشارا فيديو',
    'doctor.dashboard.patient.satisfaction': 'رضا المرضى',
    'doctor.appointment.new': 'زيارة جديدة',
    'doctor.appointment.followup': 'متابعة',
    'doctor.appointment.video': 'استشارة فيديو',
    'doctor.appointment.confirmed': 'مؤكد',
    'doctor.appointment.waiting': 'في انتظار الموافقة',
    'doctor.appointment.completed': 'مكتمل',
    'doctor.patient.age': 'العمر',
    'doctor.patient.lastVisit': 'زيارة سابقة',
    'doctor.patient.condition': 'الحالة',
    'doctor.patient.visits': 'زيارات',
    'doctor.patient.viewFile': 'عرض الملف',
    'doctor.patient.years': 'سنوات',
    
    // Dashboard - Patient specific
    'patient.dashboard.title': 'لوحة المريض',
    'patient.dashboard.welcome': 'مرحباً بك',
    'patient.dashboard.book.appointment': 'حجز موعد',
    'patient.dashboard.medications': 'الأدوية',
    'patient.dashboard.video.consultation': 'استشارة فيديو',
    'patient.dashboard.medical.records': 'سجلات طبية',
    'patient.dashboard.quick.actions': 'إجراءات سريعة',
    'patient.dashboard.upcoming.appointments': 'مواعيد قادمة',
    'patient.dashboard.active.medications': 'الأدوية النشطة',
    'patient.dashboard.recent.prescriptions': 'روشتات حديثة',
    'patient.appointment.with': 'مع',
    'patient.appointment.at': 'في',
    'patient.appointment.location': 'الموقع',
    'patient.appointment.clinic': 'العيادة',
    'patient.medication.take': 'تناول',
    'patient.medication.before.meal': 'قبل الوجبة',
    'patient.medication.after.meal': 'بعد الوجبة',
    'patient.medication.morning': 'صباحاً',
    'patient.medication.evening': 'مساءً',
    'patient.prescription.by': 'من قبل',
    'patient.prescription.view': 'عرض',
    
    // Specialties
    'specialty.cardiology': 'طبيب قلب',
    'specialty.dermatology': 'طب الجلدية',
    'specialty.pediatrics': 'طب الأطفال',
    'specialty.orthopedics': 'طب العظام',
    'specialty.neurology': 'طب العصبيات',
    'specialty.psychiatry': 'طب العقل',
    
    // Conditions/Diseases
    'condition.hypertension': 'ارتفاع ضغط الدم',
    'condition.diabetes': 'سكري مزمن نوع 2',
    'condition.asthma': 'الربو',
    'condition.arthritis': 'التهاب المفاصل',
    'condition.heartDisease': 'مرض القلب',
    
    // Medications
    'medication.aspirin': 'أسبرين',
    'medication.metformin': 'متفورمين',
    'medication.losartan': 'لوسارتان',
    'medication.atorvastatin': 'اتورفاستاتين',
    'medication.amoxicillin': 'آمونوكسيلين',
    
    // Time
    'time.morning': 'صباحاً',
    'time.afternoon': 'بعد الظهر',
    'time.evening': 'مساءً',
    'time.night': 'ليلة',
    'time.am': 'صباحاً',
    'time.pm': 'مساءً',
    
    // Days
    'day.saturday': 'السبت',
    'day.sunday': 'الأحد',
    'day.monday': 'الإثنين',
    'day.tuesday': 'الثلاثاء',
    'day.wednesday': 'الأربعاء',
    'day.thursday': 'الخميس',
    'day.friday': 'الجمعة',
    
    // Generic terms
    'generic.view': 'عرض',
    'generic.details': 'تفاصيل',
    'generic.more': 'المزيد',
    'generic.less': 'أقل',
    'generic.all': 'الكل',
    'generic.today': 'اليوم',
    'generic.tomorrow': 'غدًا',
    'generic.week': 'أسبوع',
    'generic.month': 'شهر',
    'generic.year': 'سنة',
    'generic.contact': 'اتصال',
    'generic.call': 'اتصال',
    'generic.message': 'رسالة',
    'generic.email': 'بريد إلكتروني',
    
    // Prescription Form
    'prescription.title': 'كتابة روشتة طبية',
    'prescription.patient.name': 'اسم المريض',
    'prescription.patient.age': 'العمر',
    'prescription.diagnosis': 'التشخيص',
    'prescription.medication.name': 'اسم الدواء',
    'prescription.dosage': 'الجرعة',
    'prescription.frequency': 'التكرار',
    'prescription.duration': 'المدة',
    'prescription.notes': 'ملاحظات',
    'prescription.add.medication': 'إضافة دواء',
    'prescription.save': 'حفظ الروشتة',
    'prescription.print': 'طباعة',
    'prescription.send': 'إرسال للمريض',
    'prescription.autocomplete': 'بحث تلقائي',
    'prescription.common.meds': 'أدوية شائعة',
    
    // Appointment Booking
    'appointment.book.title': 'حجز موعد',
    'appointment.select.doctor': 'اختر الطبيب',
    'appointment.select.specialty': 'اختر التخصص',
    'appointment.select.date': 'اختر التاريخ',
    'appointment.select.time': 'اختر الوقت',
    'appointment.reason': 'سبب الزيارة',
    'appointment.type': 'نوع الموعد',
    'appointment.clinic': 'العيادة',
    'appointment.online': 'استشارة أونلاين',
    'appointment.inperson': 'زيارة شخصية',
    'appointment.confirm': 'تأكيد الموعد',
    'appointment.available.slots': 'المواعيد المتاحة',
    'appointment.no.slots': 'لا توجد مواعيد متاحة',
    'appointment.success': 'تم حجز الموعد بنجاح',
    
    // Medication Reminder
    'medication.reminder.title': 'تذكير الأدوية',
    'medication.add.new': 'إضافة دواء جديد',
    'medication.name': 'اسم الدواء',
    'medication.dose': 'الجرعة',
    'medication.time': 'وقت التناول',
    'medication.frequency': 'التكرار',
    'medication.start.date': 'تاريخ البدء',
    'medication.end.date': 'تاريخ الانتهاء',
    'medication.with.food': 'مع الطعام',
    'medication.without.food': 'بدون طعام',
    'medication.taken': 'تم التناول',
    'medication.missed': 'فاتني',
    'medication.upcoming': 'قادم',
    'medication.schedule': 'جدول الأدوية',
    'medication.history': 'سجل التناول',
    
    // Pharmacy Delivery
    'pharmacy.title': 'طلب أدوية',
    'pharmacy.search': 'ابحث عن دواء',
    'pharmacy.cart': 'السلة',
    'pharmacy.add.to.cart': 'أضف للسلة',
    'pharmacy.total': 'الإجمالي',
    'pharmacy.delivery.address': 'عنوان التوصيل',
    'pharmacy.delivery.time': 'وقت التوصيل',
    'pharmacy.payment.method': 'طريقة الدفع',
    'pharmacy.cash': 'دفع نقدي',
    'pharmacy.card': 'بطاقة ائتمان',
    'pharmacy.place.order': 'تأكيد الطلب',
    'pharmacy.order.success': 'تم الطلب بنجاح',
    'pharmacy.estimated.delivery': 'وقت التوصيل المتوقع',
    'pharmacy.prescription.required': 'يتطلب روشتة',
    'pharmacy.available': 'متوفر',
    'pharmacy.out.of.stock': 'غير متوفر',
    
    // Video Consultation
    'video.title': 'استشارة مرئية',
    'video.start': 'بدء الاستشارة',
    'video.join': 'نضم للمكالمة',
    'video.end': 'إنهاء الاستشارة',
    'video.mute': 'كتم الصوت',
    'video.unmute': 'تشغيل الصوت',
    'video.camera.on': 'تشغيل الكاميرا',
    'video.camera.off': 'إيقاف الكاميرا',
    'video.chat': 'محادثة نصية',
    'video.share.screen': 'مشاركة الشاشة',
    'video.waiting': 'في انتظار الطبيب',
    'video.connecting': 'جاري الاتصال',
    'video.duration': 'مدة الاستشارة',
    'video.prescription': 'إرسال روشتة',
    
    // Rating System
    'rating.title': 'التقييمات والمراجعات',
    'rating.rate.doctor': 'قيم الطبيب',
    'rating.your.rating': 'تقييمك',
    'rating.write.review': 'اكتب مراجعة',
    'rating.submit': 'إرسال التقييم',
    'rating.all.reviews': 'جميع المراجعات',
    'rating.recent': 'الأحدث',
    'rating.highest': 'الأعلى تقييماً',
    'rating.helpful': 'مفيد',
    'rating.report': 'بلاغ',
    
    // Patient Profile
    'profile.title': 'الملف الشخصي',
    'profile.personal.info': 'المعلومات الشخصية',
    'profile.medical.history': 'السجل الطبي',
    'profile.chronic.diseases': 'الأمراض المزمنة',
    'profile.allergies': 'الحساسية',
    'profile.blood.type': 'فصيلة الدم',
    'profile.height': 'الطول',
    'profile.weight': 'الوزن',
    'profile.emergency.contact': 'جهة اتصال طارئة',
    'profile.insurance': 'التأمين الصحي',
    'profile.update': 'تحديث البيانات',
    'profile.change.password': 'تغيير كلمة المرور',
    'profile.settings': 'الإعدادات',
    
    // Patient Files (Doctor view)
    'files.title': 'ملفات المرضى',
    'files.search.patient': 'ابحث عن مريض',
    'files.patient.info': 'معلومات المريض',
    'files.medical.history': 'التاريخ المرضي',
    'files.prescriptions': 'الروشتات',
    'files.lab.results': 'نتائج التحاليل',
    'files.xrays': 'الأشعة',
    'files.notes': 'ملاحظات الطبيب',
    'files.add.note': 'إضافة ملاحظة',
    'files.upload.document': 'رفع مستند',
    'files.view.history': 'عرض السجل',
  },
  en: {
    // App name
    'app.name': 'Salamtak',
    'app.tagline': 'The Future of Digital Healthcare',
    'app.description': 'An integrated medical platform connecting doctors and patients with modern technology and exceptional experience',
    
    // User types
    'user.patient': 'I am a Patient',
    'user.doctor': 'I am a Doctor',
    'patient.subtitle': 'Comprehensive healthcare in the comfort of your home',
    'doctor.subtitle': 'Professional platform to manage your medical practice',
    
    // Actions
    'action.start': 'Start Your Health Journey',
    'action.join': 'Join Our Medical Team',
    'action.login': 'Login',
    'action.logout': 'Logout',
    'action.back': 'Back',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.submit': 'Submit',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.search': 'Search',
    'action.filter': 'Filter',
    'action.add': 'Add',
    'action.remove': 'Remove',
    
    // Features - Patient
    'feature.appointments': 'Book Appointments',
    'feature.health.tracking': 'Health Tracking',
    'feature.medication.reminder': 'Medication Reminders',
    'feature.video.consultation': 'Video Consultations',
    
    // Features - Doctor
    'feature.patient.management': 'Patient Management',
    'feature.digital.prescription': 'Digital Prescriptions',
    'feature.schedule': 'Schedule Appointments',
    'feature.remote.consultation': 'Remote Consultations',
    
    // Main Features
    'main.feature.comprehensive': 'Comprehensive Care',
    'main.feature.comprehensive.desc': 'Complete medical follow-up from diagnosis to treatment',
    'main.feature.secure': 'Absolute Security',
    'main.feature.secure.desc': 'Complete protection of medical and personal data',
    'main.feature.available': 'Always Available',
    'main.feature.available.desc': 'Medical services available 24/7 from anywhere',
    
    // Stats
    'stats.doctors': 'Specialist Doctors',
    'stats.patients': 'Satisfied Patients',
    'stats.consultations': 'Medical Consultations',
    'stats.satisfaction': 'Satisfaction Rate',
    
    // Dashboard
    'dashboard.welcome': 'Welcome',
    'dashboard.patient': 'Patient Dashboard',
    'dashboard.doctor': 'Doctor Dashboard',
    'dashboard.overview': 'Overview',
    'dashboard.appointments': 'Appointments',
    'dashboard.patients': 'Patients',
    'dashboard.prescriptions': 'Prescriptions',
    'dashboard.consultations': 'Consultations',
    'dashboard.statistics': 'Statistics',
    
    // Pages
    'page.prescription': 'Write Medical Prescription',
    'page.appointment': 'Book Appointment',
    'page.medication': 'Medication Reminder',
    'page.pharmacy': 'Order Medications',
    'page.video': 'Video Consultation',
    'page.rating': 'Ratings & Reviews',
    'page.profile': 'Personal Profile',
    'page.files': 'Patient Files',
    
    // Settings
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.light': 'Light',
    'settings.dark': 'Dark',
    'settings.arabic': 'العربية',
    'settings.english': 'English',
    
    // Login
    'login.title': 'Login',
    'doctor.login.title': 'Doctor Login',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.phone': 'Phone Number',
    'login.remember': 'Remember me',
    'login.forgot': 'Forgot password?',
    'login.welcome': 'Welcome',
    'login.continue': 'Continue',
    'login.submit': 'Login',
    
    // Register
    'register.name': 'Full Name',
    'register.name.placeholder': 'Enter your full name',
    'register.phone': 'Phone Number',
    'register.email': 'Email Address',
    'register.birthdate': 'Birth Date',
    'register.password': 'Password',
    'register.confirmPassword': 'Confirm Password',
    'register.submit': 'Register',
    
    // Common
    'common.doctor': 'Doctor',
    'common.patient': 'Patient',
    'common.appointment': 'Appointment',
    'common.prescription': 'Prescription',
    'common.medication': 'Medication',
    'common.diagnosis': 'Diagnosis',
    'common.treatment': 'Treatment',
    'common.report': 'Report',
    'common.notes': 'Notes',
    'common.date': 'Date',
    'common.time': 'Time',
    'common.status': 'Status',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.pending': 'Pending',
    'common.completed': 'Completed',
    'common.cancelled': 'Cancelled',
    
    // Default names
    'default.patient.name': 'Osama Reda Rafat',
    'default.doctor.name': 'Dr. Mokhtar Nabil',
    'default.doctor2.name': 'Dr. Moamen Ismail',
    'default.doctor3.name': 'Dr. Mohamed Alaa',
    
    // Currency
    'currency': 'Egyptian Pound',
    'currency.short': 'EGP',
    
    // Dashboard - Doctor specific
    'doctor.dashboard.title': 'Doctor Dashboard',
    'doctor.dashboard.today.appointments': 'Today\'s Appointments',
    'doctor.dashboard.upcoming': 'Upcoming Appointments',
    'doctor.dashboard.patient.files': 'Patient Files',
    'doctor.dashboard.statistics': 'Statistics',
    'doctor.dashboard.total.patients': 'Total Patients',
    'doctor.dashboard.today.appointments.count': 'Today\'s Appointments',
    'doctor.dashboard.video.consultations': 'Video Consultations',
    'doctor.dashboard.patient.satisfaction': 'Patient Satisfaction',
    'doctor.appointment.new': 'New Visit',
    'doctor.appointment.followup': 'Follow-up',
    'doctor.appointment.video': 'Video Consultation',
    'doctor.appointment.confirmed': 'Confirmed',
    'doctor.appointment.waiting': 'Waiting',
    'doctor.appointment.completed': 'Completed',
    'doctor.patient.age': 'Age',
    'doctor.patient.lastVisit': 'Last Visit',
    'doctor.patient.condition': 'Condition',
    'doctor.patient.visits': 'Visits',
    'doctor.patient.viewFile': 'View File',
    'doctor.patient.years': 'years',
    
    // Dashboard - Patient specific
    'patient.dashboard.title': 'Patient Dashboard',
    'patient.dashboard.welcome': 'Welcome',
    'patient.dashboard.book.appointment': 'Book Appointment',
    'patient.dashboard.medications': 'Medications',
    'patient.dashboard.video.consultation': 'Video Consultation',
    'patient.dashboard.medical.records': 'Medical Records',
    'patient.dashboard.quick.actions': 'Quick Actions',
    'patient.dashboard.upcoming.appointments': 'Upcoming Appointments',
    'patient.dashboard.active.medications': 'Active Medications',
    'patient.dashboard.recent.prescriptions': 'Recent Prescriptions',
    'patient.appointment.with': 'With',
    'patient.appointment.at': 'at',
    'patient.appointment.location': 'Location',
    'patient.appointment.clinic': 'Clinic',
    'patient.medication.take': 'Take',
    'patient.medication.before.meal': 'before meal',
    'patient.medication.after.meal': 'after meal',
    'patient.medication.morning': 'Morning',
    'patient.medication.evening': 'Evening',
    'patient.prescription.by': 'By',
    'patient.prescription.view': 'View',
    
    // Specialties
    'specialty.cardiology': 'Cardiology',
    'specialty.dermatology': 'Dermatology',
    'specialty.pediatrics': 'Pediatrics',
    'specialty.orthopedics': 'Orthopedics',
    'specialty.neurology': 'Neurology',
    'specialty.psychiatry': 'Psychiatry',
    
    // Conditions/Diseases
    'condition.hypertension': 'Hypertension',
    'condition.diabetes': 'Type 2 Diabetes',
    'condition.asthma': 'Asthma',
    'condition.arthritis': 'Arthritis',
    'condition.heartDisease': 'Heart Disease',
    
    // Medications
    'medication.aspirin': 'Aspirin',
    'medication.metformin': 'Metformin',
    'medication.losartan': 'Losartan',
    'medication.atorvastatin': 'Atorvastatin',
    'medication.amoxicillin': 'Amoxicillin',
    
    // Time
    'time.morning': 'Morning',
    'time.afternoon': 'Afternoon',
    'time.evening': 'Evening',
    'time.night': 'Night',
    'time.am': 'AM',
    'time.pm': 'PM',
    
    // Days
    'day.saturday': 'Saturday',
    'day.sunday': 'Sunday',
    'day.monday': 'Monday',
    'day.tuesday': 'Tuesday',
    'day.wednesday': 'Wednesday',
    'day.thursday': 'Thursday',
    'day.friday': 'Friday',
    
    // Generic terms
    'generic.view': 'View',
    'generic.details': 'Details',
    'generic.more': 'More',
    'generic.less': 'Less',
    'generic.all': 'All',
    'generic.today': 'Today',
    'generic.tomorrow': 'Tomorrow',
    'generic.week': 'Week',
    'generic.month': 'Month',
    'generic.year': 'Year',
    'generic.contact': 'Contact',
    'generic.call': 'Call',
    'generic.message': 'Message',
    'generic.email': 'Email',
    
    // Prescription Form
    'prescription.title': 'Writing Medical Prescription',
    'prescription.patient.name': 'Patient Name',
    'prescription.patient.age': 'Age',
    'prescription.diagnosis': 'Diagnosis',
    'prescription.medication.name': 'Medication Name',
    'prescription.dosage': 'Dosage',
    'prescription.frequency': 'Frequency',
    'prescription.duration': 'Duration',
    'prescription.notes': 'Notes',
    'prescription.add.medication': 'Add Medication',
    'prescription.save': 'Save Prescription',
    'prescription.print': 'Print',
    'prescription.send': 'Send to Patient',
    'prescription.autocomplete': 'Autocomplete',
    'prescription.common.meds': 'Common Medications',
    
    // Appointment Booking
    'appointment.book.title': 'Book Appointment',
    'appointment.select.doctor': 'Select Doctor',
    'appointment.select.specialty': 'Select Specialty',
    'appointment.select.date': 'Select Date',
    'appointment.select.time': 'Select Time',
    'appointment.reason': 'Reason for Visit',
    'appointment.type': 'Appointment Type',
    'appointment.clinic': 'Clinic',
    'appointment.online': 'Online Consultation',
    'appointment.inperson': 'In-Person Visit',
    'appointment.confirm': 'Confirm Appointment',
    'appointment.available.slots': 'Available Slots',
    'appointment.no.slots': 'No Available Slots',
    'appointment.success': 'Appointment Booked Successfully',
    
    // Medication Reminder
    'medication.reminder.title': 'Medication Reminder',
    'medication.add.new': 'Add New Medication',
    'medication.name': 'Medication Name',
    'medication.dose': 'Dose',
    'medication.time': 'Time',
    'medication.frequency': 'Frequency',
    'medication.start.date': 'Start Date',
    'medication.end.date': 'End Date',
    'medication.with.food': 'With Food',
    'medication.without.food': 'Without Food',
    'medication.taken': 'Taken',
    'medication.missed': 'Missed',
    'medication.upcoming': 'Upcoming',
    'medication.schedule': 'Medication Schedule',
    'medication.history': 'Medication History',
    
    // Pharmacy Delivery
    'pharmacy.title': 'Order Medications',
    'pharmacy.search': 'Search for Medication',
    'pharmacy.cart': 'Cart',
    'pharmacy.add.to.cart': 'Add to Cart',
    'pharmacy.total': 'Total',
    'pharmacy.delivery.address': 'Delivery Address',
    'pharmacy.delivery.time': 'Delivery Time',
    'pharmacy.payment.method': 'Payment Method',
    'pharmacy.cash': 'Cash',
    'pharmacy.card': 'Credit Card',
    'pharmacy.place.order': 'Place Order',
    'pharmacy.order.success': 'Order Placed Successfully',
    'pharmacy.estimated.delivery': 'Estimated Delivery Time',
    'pharmacy.prescription.required': 'Prescription Required',
    'pharmacy.available': 'Available',
    'pharmacy.out.of.stock': 'Out of Stock',
    
    // Video Consultation
    'video.title': 'Video Consultation',
    'video.start': 'Start Consultation',
    'video.join': 'Join Call',
    'video.end': 'End Consultation',
    'video.mute': 'Mute',
    'video.unmute': 'Unmute',
    'video.camera.on': 'Turn On Camera',
    'video.camera.off': 'Turn Off Camera',
    'video.chat': 'Text Chat',
    'video.share.screen': 'Share Screen',
    'video.waiting': 'Waiting for Doctor',
    'video.connecting': 'Connecting',
    'video.duration': 'Consultation Duration',
    'video.prescription': 'Send Prescription',
    
    // Rating System
    'rating.title': 'Ratings & Reviews',
    'rating.rate.doctor': 'Rate Doctor',
    'rating.your.rating': 'Your Rating',
    'rating.write.review': 'Write Review',
    'rating.submit': 'Submit Rating',
    'rating.all.reviews': 'All Reviews',
    'rating.recent': 'Recent',
    'rating.highest': 'Highest Rated',
    'rating.helpful': 'Helpful',
    'rating.report': 'Report',
    
    // Patient Profile
    'profile.title': 'Personal Profile',
    'profile.personal.info': 'Personal Information',
    'profile.medical.history': 'Medical History',
    'profile.chronic.diseases': 'Chronic Diseases',
    'profile.allergies': 'Allergies',
    'profile.blood.type': 'Blood Type',
    'profile.height': 'Height',
    'profile.weight': 'Weight',
    'profile.emergency.contact': 'Emergency Contact',
    'profile.insurance': 'Health Insurance',
    'profile.update': 'Update Information',
    'profile.change.password': 'Change Password',
    'profile.settings': 'Settings',
    
    // Patient Files (Doctor view)
    'files.title': 'Patient Files',
    'files.search.patient': 'Search Patient',
    'files.patient.info': 'Patient Information',
    'files.medical.history': 'Medical History',
    'files.prescriptions': 'Prescriptions',
    'files.lab.results': 'Lab Results',
    'files.xrays': 'X-Rays',
    'files.notes': 'Doctor Notes',
    'files.add.note': 'Add Note',
    'files.upload.document': 'Upload Document',
    'files.view.history': 'View History',
  }
};