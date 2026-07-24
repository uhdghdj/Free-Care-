// SUNGET — Per business-type configuration.
// Each entry defines: label, icon, sidebar menu, extra pages beyond core.
window.SUNGET_BIZ_CONFIG = {
  hotel: {
    label: 'الفندق', labelEn: 'Hotel', icon: 'fa-hotel',
    table: 'hotels', foreignKey: 'hotel_id',
    extraMenu: [
      { key:'info',     label:'بيانات الفندق',   icon:'fa-hotel' },
      { key:'rooms',    label:'الغرف',           icon:'fa-bed' },
      { key:'photos',   label:'صور الغرف',       icon:'fa-images' },
      { key:'amenities',label:'المرافق',         icon:'fa-swimming-pool' },
      { key:'guests',   label:'النزلاء',         icon:'fa-user-friends' },
    ],
  },
  restaurant: {
    label: 'المطعم', labelEn: 'Restaurant', icon: 'fa-utensils',
    table: 'restaurants', foreignKey: 'restaurant_id',
    extraMenu: [
      { key:'info',       label:'بيانات المطعم',   icon:'fa-utensils' },
      { key:'categories', label:'أقسام القائمة',   icon:'fa-list' },
      { key:'items',      label:'أطباق القائمة',   icon:'fa-hamburger' },
      { key:'reservations',label:'الحجوزات',       icon:'fa-calendar-check' },
      { key:'orders',     label:'الطلبات',         icon:'fa-receipt' },
      { key:'gallery',    label:'المعرض',          icon:'fa-images' },
    ],
  },
  cafe: {
    label: 'الكافيه', labelEn: 'Cafe', icon: 'fa-mug-hot',
    table: 'cafes', foreignKey: 'cafe_id',
    extraMenu: [
      { key:'info',       label:'بيانات الكافيه',   icon:'fa-mug-hot' },
      { key:'categories', label:'أقسام القائمة',    icon:'fa-list' },
      { key:'items',      label:'مشروبات/أطباق',    icon:'fa-coffee' },
      { key:'reservations',label:'الحجوزات',        icon:'fa-calendar-check' },
      { key:'orders',     label:'الطلبات',          icon:'fa-receipt' },
      { key:'gallery',    label:'المعرض',           icon:'fa-images' },
    ],
  },
  car: {
    label: 'تأجير السيارات', labelEn: 'Car Rental', icon: 'fa-car',
    table: 'car_companies', foreignKey: 'car_company_id',
    extraMenu: [
      { key:'info',    label:'بيانات الشركة',  icon:'fa-building' },
      { key:'cars',    label:'السيارات',       icon:'fa-car' },
      { key:'photos',  label:'صور السيارات',   icon:'fa-images' },
      { key:'prices',  label:'الأسعار',        icon:'fa-tags' },
      { key:'customers',label:'العملاء',       icon:'fa-user-friends' },
    ],
  },
  trip: {
    label: 'الرحلات', labelEn: 'Trips', icon: 'fa-route',
    table: 'trip_companies', foreignKey: 'trip_company_id',
    extraMenu: [
      { key:'info',     label:'بيانات الشركة',  icon:'fa-building' },
      { key:'trips',    label:'الرحلات',        icon:'fa-route' },
      { key:'dates',    label:'تواريخ الرحلات', icon:'fa-calendar' },
      { key:'schedule', label:'جدول الرحلة',    icon:'fa-clock' },
      { key:'photos',   label:'صور الرحلات',    icon:'fa-images' },
      { key:'features', label:'المميزات',       icon:'fa-star' },
      { key:'customers',label:'العملاء',        icon:'fa-user-friends' },
    ],
  },
};

window.SUNGET_CORE_MENU_TOP = [
  { key:'dashboard',   label:'الرئيسية',      icon:'fa-gauge-high' },
  { key:'businesses',  label:'منشآتي',        icon:'fa-briefcase' },
];
window.SUNGET_CORE_MENU_BOTTOM = [
  { key:'bookings',    label:'الحجوزات',      icon:'fa-calendar-check' },
  { key:'messages',    label:'الرسائل',       icon:'fa-comments' },
  { key:'reviews',     label:'التقييمات',     icon:'fa-star' },
  { key:'offers',      label:'العروض',        icon:'fa-percent' },
  { key:'coupons',     label:'الكوبونات',     icon:'fa-ticket' },
  { key:'wallet',      label:'المحفظة',       icon:'fa-wallet' },
  { key:'statistics',  label:'الإحصائيات',    icon:'fa-chart-line' },
  { key:'settings',    label:'الإعدادات',     icon:'fa-cog' },
];
