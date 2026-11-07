// إعدادات نظام حسابات الطلاب (تسجيل الدخول برمز واتساب).
// لو غيّرت دومين السيرفر (مثلاً صار عندك دومين حقيقي بدل sslip.io) غيّر السطر الأول بس.
window.StudentAccountConfig = {
  api: 'https://162-35-38-7.sslip.io',
  mount: '#accountSlot',
  tracks: [
    { label: '2011 — الصف العاشر', grade: 10 },
    { label: '2010 — النظام الحالي', grade: 11 },
    { label: '2009 — متقدم', grade: 12 },
    { label: '2009 — أعمال', grade: 12 }
  ]
};
