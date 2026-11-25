(function () {
  function isoDay(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  }

  const today = isoDay(0);
  const tomorrow = isoDay(1);
  const yesterday = isoDay(-1);

  const NICHES = {
    barbershop: {
      id: 'barbershop',
      name: 'Барбершоп',
      shortName: 'Барбершоп',
      defaultBusinessName: 'Blade & Crown',
      address: 'ул. Покровка, 24',
      phone: '+7 (495) 812-40-20',
      hours: '10:00 — 22:00',
      icon: 'scissors',
      accent: '#d97706',
      accentHover: '#b45309',
      accentSoft: 'rgba(217, 119, 6, 0.12)',
      accentRing: 'rgba(217, 119, 6, 0.24)',
      tagline: 'Управление креслами, барберами и возвращаемостью гостей',
      terms: {
        bookingSingular: 'Запись',
        bookingsPlural: 'Записи',
        createBooking: 'Новая запись',
        clientSingular: 'Клиент',
        clientsPlural: 'Клиенты',
        staffSingular: 'Барбер',
        staffPlural: 'Барберы',
        resourceCol: 'Кресла и барберы',
        serviceTab: 'Услуги и уход',
        productTab: 'Косметика',
        extraFieldLabel: 'Кресло / Пожелания',
        extraFieldPlaceholder: 'Напр.: Кресло №2, фейд + эспрессо',
        statusMap: {
          confirmed: 'Подтверждена',
          pending: 'Ожидает',
          in_progress: 'В кресле',
          completed: 'Завершена',
          cancelled: 'Отменена'
        }
      },
      kpis: [
        { label: 'Выручка сегодня', base: 46800, delta: '+14.2%', up: true, icon: 'wallet', spark: [31, 35, 33, 40, 38, 44, 47], format: 'money' },
        { label: 'Записей на смену', value: '18 / 22', delta: '82% загрузка', up: true, icon: 'calendar', spark: [12, 14, 15, 16, 15, 17, 18], format: 'text' },
        { label: 'Средний чек', base: 2600, delta: '+7.8%', up: true, icon: 'trending', spark: [2200, 2350, 2400, 2380, 2500, 2550, 2600], format: 'money' },
        { label: 'Возвращаемость', value: '74%', delta: '+4.1%', up: true, icon: 'star', spark: [66, 68, 69, 71, 70, 73, 74], format: 'text' }
      ],
      insights: [
        { type: 'warning', title: 'Пора напомнить 4 постоянным клиентам', desc: 'Их последний визит был 28–35 дней назад. Авто-SMS вернёт до 70%.' },
        { type: 'accent', title: 'Допродажи косметики выросли на 18%', desc: 'Матовая глина Uppercut чаще всего берётся после стрижки кроп.' },
        { type: 'success', title: 'Вечерняя загрузка 18:00–21:00 — 96%', desc: 'Свободен только 1 слот у Данилы К. в 19:30.' }
      ],
      staff: [
        { id: 'st1', name: 'Артём Волков', role: 'Топ-барбер', status: 'На смене', busy: 92, rating: 4.97, bookingsCount: 112, revenue: 284000, commission: '45%', schedule: '10:00 — 21:00', tags: ['Фейд', 'Моделирование бороды'] },
        { id: 'st2', name: 'Данила Кузнецов', role: 'Старший барбер', status: 'В кресле', busy: 85, rating: 4.91, bookingsCount: 96, revenue: 229000, commission: '40%', schedule: '10:00 — 21:00', tags: ['Классика', 'Королевское бритьё'] },
        { id: 'st3', name: 'Тимур Садыков', role: 'Барбер', status: 'Свободен', busy: 74, rating: 4.86, bookingsCount: 78, revenue: 171500, commission: '35%', schedule: '11:00 — 22:00', tags: ['Стрижка ножницами', 'Тонирование'] },
        { id: 'st4', name: 'Егор Миронов', role: 'Младший барбер', status: 'Выходной', busy: 68, rating: 4.80, bookingsCount: 61, revenue: 118000, commission: '30%', schedule: 'Выходной', tags: ['Базовые стрижки', 'Укладка'] }
      ],
      services: [
        { id: 'sv1', kind: 'service', name: 'Мужская стрижка + укладка', category: 'Стрижки', price: 2200, duration: 60, cost: 420, active: true, popular: 94 },
        { id: 'sv2', kind: 'service', name: 'Комбо: Стрижка + Борода', category: 'Комплексы', price: 3400, duration: 90, cost: 680, active: true, popular: 88 },
        { id: 'sv3', kind: 'service', name: 'Моделирование бороды и усов', category: 'Борода', price: 1500, duration: 45, cost: 310, active: true, popular: 72 },
        { id: 'sv4', kind: 'service', name: 'Королевское бритьё опасной бритвой', category: 'Бритьё', price: 1800, duration: 45, cost: 390, active: true, popular: 54 },
        { id: 'sv5', kind: 'product', name: 'Матовая глина Uppercut Deluxe 70г', category: 'Стайлинг', price: 1950, stock: 14, minStock: 5, sku: 'BC-104', cost: 1050, active: true },
        { id: 'sv6', kind: 'product', name: 'Масло для бороды Morgan’s 50мл', category: 'Уход', price: 1650, stock: 3, minStock: 6, sku: 'BC-209', cost: 820, active: true }
      ],
      clients: [
        { id: 'cl1', name: 'Максим Соколов', phone: '+7 (916) 402-11-34', segment: 'VIP', visits: 24, ltv: 68400, lastVisit: yesterday, note: 'Предпочитает низкий фейд, без пробора. Артём В.', tag: 'Американо без сахара' },
        { id: 'cl2', name: 'Илья Громов', phone: '+7 (926) 774-09-12', segment: 'Постоянный', visits: 11, ltv: 29200, lastVisit: isoDay(-6), note: 'Ходит каждые 3 недели по пятницам.', tag: 'Чувствительная кожа' },
        { id: 'cl3', name: 'Денис Белов', phone: '+7 (903) 551-83-90', segment: 'Новый', visits: 1, ltv: 3400, lastVisit: today, note: 'Пришёл по рекомендации Максима Соколова.', tag: 'Первый визит' },
        { id: 'cl4', name: 'Роман Лебедев', phone: '+7 (985) 310-44-71', segment: 'Спящий', visits: 7, ltv: 18900, lastVisit: isoDay(-34), note: 'Не был больше месяца — отправить промо на 15%.', tag: 'Требует касания' },
        { id: 'cl5', name: 'Кирилл Орлов', phone: '+7 (915) 619-28-04', segment: 'VIP', visits: 19, ltv: 52100, lastVisit: isoDay(-4), note: 'Всегда берёт комбо + тонирование седины.', tag: 'Парковка у входа' }
      ],
      bookings: [
        { id: 'bk1', clientId: 'cl1', staffId: 'st1', serviceId: 'sv2', date: today, time: '10:30', duration: 90, price: 3400, status: 'completed', extra: 'Кресло №1 • Без пробора', channel: 'Постоянный' },
        { id: 'bk2', clientId: 'cl2', staffId: 'st2', serviceId: 'sv1', date: today, time: '11:00', duration: 60, price: 2200, status: 'completed', extra: 'Кресло №2 • Ножницами сверху', channel: 'Онлайн-запись' },
        { id: 'bk3', clientId: 'cl3', staffId: 'st1', serviceId: 'sv2', date: today, time: '13:00', duration: 90, price: 3400, status: 'in_progress', extra: 'Кресло №1 • Реферал', channel: 'Рекомендация' },
        { id: 'bk4', clientId: 'cl5', staffId: 'st3', serviceId: 'sv3', date: today, time: '14:00', duration: 45, price: 1500, status: 'confirmed', extra: 'Кресло №3 • Горячее полотенце', channel: 'Telegram' },
        { id: 'bk5', clientId: 'cl4', staffId: 'st2', serviceId: 'sv4', date: today, time: '16:00', duration: 60, price: 1800, status: 'pending', extra: 'Кресло №2 • Подтвердить за 2 часа', channel: 'Онлайн-запись' },
        { id: 'bk6', clientId: 'cl1', staffId: 'st1', serviceId: 'sv1', date: tomorrow, time: '12:00', duration: 60, price: 2200, status: 'confirmed', extra: 'Кресло №1', channel: 'Постоянный' }
      ]
    },

    salon: {
      id: 'salon',
      name: 'Салон красоты',
      shortName: 'Салон красоты',
      defaultBusinessName: 'Aura Beauty Studio',
      address: 'Патриарший пер., 12',
      phone: '+7 (495) 940-18-55',
      hours: '09:00 — 21:00',
      icon: 'flower',
      accent: '#db2777',
      accentHover: '#be185d',
      accentSoft: 'rgba(219, 39, 119, 0.11)',
      accentRing: 'rgba(219, 39, 119, 0.22)',
      tagline: 'Окрашивания, уходы, маникюр, загрузка мастеров и домашний уход',
      terms: {
        bookingSingular: 'Запись',
        bookingsPlural: 'Записи',
        createBooking: 'Новая запись',
        clientSingular: 'Клиент',
        clientsPlural: 'Клиенты',
        staffSingular: 'Мастер',
        staffPlural: 'Мастера',
        resourceCol: 'Мастера и кабинеты',
        serviceTab: 'Бьюти-услуги',
        productTab: 'Витрина ухода',
        extraFieldLabel: 'Кабинет / Формула цвета',
        extraFieldPlaceholder: 'Напр.: Кабинет 2, тёплый блонд',
        statusMap: {
          confirmed: 'Подтверждена',
          pending: 'Ожидает',
          in_progress: 'На процедуре',
          completed: 'Оплачена',
          cancelled: 'Отменена'
        }
      },
      kpis: [
        { label: 'Выручка сегодня', base: 84200, delta: '+19.4%', up: true, icon: 'wallet', spark: [52, 60, 58, 69, 72, 79, 84], format: 'money' },
        { label: 'Загрузка студий', value: '88%', delta: '+6.0%', up: true, icon: 'calendar', spark: [71, 74, 78, 80, 82, 85, 88], format: 'text' },
        { label: 'Средний чек', base: 5400, delta: '+11.2%', up: true, icon: 'trending', spark: [4400, 4600, 4900, 5100, 5050, 5250, 5400], format: 'money' },
        { label: 'Повторные визиты', value: '81%', delta: '+3.5%', up: true, icon: 'star', spark: [75, 76, 77, 79, 78, 80, 81], format: 'text' }
      ],
      insights: [
        { type: 'accent', title: 'Airtouch даёт 42% всей маржи недели', desc: 'У топ-колориста Алины открыто всего 2 окна на выходные.' },
        { type: 'warning', title: 'Заканчивается сыворотка Olaplex No.6', desc: 'На витрине осталось 2 шт. при среднем спросе 6 шт/неделю.' },
        { type: 'success', title: '3 гостьи записались на комплекс (волосы + маникюр)', desc: 'Средний чек комплексного визита выше на 64%.' }
      ],
      staff: [
        { id: 'st1', name: 'Алина Романова', role: 'Топ-колорист', status: 'На процедуре', busy: 95, rating: 4.99, bookingsCount: 84, revenue: 462000, commission: '45%', schedule: '09:30 — 20:30', tags: ['Airtouch', 'Сложное окрашивание'] },
        { id: 'st2', name: 'Мария Кравцова', role: 'Nail-стилист', status: 'На смене', busy: 86, rating: 4.94, bookingsCount: 118, revenue: 295000, commission: '40%', schedule: '09:00 — 21:00', tags: ['Японский маникюр', 'Педикюр'] },
        { id: 'st3', name: 'София Вебер', role: 'Косметолог-эстетист', status: 'Свободна', busy: 78, rating: 4.92, bookingsCount: 67, revenue: 268000, commission: '42%', schedule: '10:00 — 20:00', tags: ['Пилинги', 'Уход Hydra'] },
        { id: 'st4', name: 'Дарья Новикова', role: 'Бровист / Визажист', status: 'На смене', busy: 72, rating: 4.88, bookingsCount: 91, revenue: 184000, commission: '38%', schedule: '10:00 — 21:00', tags: ['Ламинирование', 'Вечерний образ'] }
      ],
      services: [
        { id: 'sv1', kind: 'service', name: 'Сложное окрашивание Airtouch', category: 'Волосы', price: 12500, duration: 180, cost: 3200, active: true, popular: 96 },
        { id: 'sv2', kind: 'service', name: 'Маникюр с укреплением гелем', category: 'Ногтевой сервис', price: 2900, duration: 90, cost: 540, active: true, popular: 92 },
        { id: 'sv3', kind: 'service', name: 'Уход «Абсолютное счастье для волос»', category: 'Уход', price: 4800, duration: 75, cost: 1350, active: true, popular: 79 },
        { id: 'sv4', kind: 'service', name: 'Архитектура и окрашивание бровей', category: 'Брови', price: 2100, duration: 45, cost: 320, active: true, popular: 84 },
        { id: 'sv5', kind: 'product', name: 'Крем-сыворотка Olaplex No.6 100мл', category: 'Домашний уход', price: 3400, stock: 2, minStock: 5, sku: 'AB-301', cost: 1950, active: true },
        { id: 'sv6', kind: 'product', name: 'Масло для кутикулы Bandi Flower', category: 'Уход за руками', price: 1290, stock: 18, minStock: 6, sku: 'AB-118', cost: 640, active: true }
      ],
      clients: [
        { id: 'cl1', name: 'Екатерина Морозова', phone: '+7 (916) 223-98-11', segment: 'VIP', visits: 18, ltv: 142000, lastVisit: isoDay(-3), note: 'Формула Wella 9/16 + 9/0. Любит раф на миндальном.', tag: 'Карта лояльности Gold' },
        { id: 'cl2', name: 'Виктория Лапина', phone: '+7 (925) 890-14-62', segment: 'Постоянный', visits: 9, ltv: 41800, lastVisit: isoDay(-12), note: 'Маникюр каждые 3 недели у Марии К.', tag: 'Нюд / миндаль' },
        { id: 'cl3', name: 'Анастасия Зуева', phone: '+7 (903) 441-55-08', segment: 'Новый', visits: 1, ltv: 4800, lastVisit: today, note: 'Запись из Instagram на уход Lebel.', tag: 'Приветственный бонус' },
        { id: 'cl4', name: 'Ольга Смирнова', phone: '+7 (910) 762-31-40', segment: 'Спящий', visits: 6, ltv: 33600, lastVisit: isoDay(-42), note: 'Давно не была на уходе у Софии.', tag: 'Отправить сертификат' }
      ],
      bookings: [
        { id: 'bk1', clientId: 'cl1', staffId: 'st1', serviceId: 'sv1', date: today, time: '10:00', duration: 180, price: 12500, status: 'in_progress', extra: 'Кабинет 1 • Wella 9/16', channel: 'Постоянный' },
        { id: 'bk2', clientId: 'cl2', staffId: 'st2', serviceId: 'sv2', date: today, time: '11:30', duration: 90, price: 2900, status: 'completed', extra: 'Стол 2 • Нюд-база', channel: 'Онлайн-запись' },
        { id: 'bk3', clientId: 'cl3', staffId: 'st3', serviceId: 'sv3', date: today, time: '13:30', duration: 75, price: 4800, status: 'confirmed', extra: 'SPA-кабинет', channel: 'Instagram' },
        { id: 'bk4', clientId: 'cl4', staffId: 'st4', serviceId: 'sv4', date: today, time: '15:30', duration: 45, price: 2100, status: 'pending', extra: 'Зона визажа', channel: 'WhatsApp' },
        { id: 'bk5', clientId: 'cl2', staffId: 'st4', serviceId: 'sv4', date: tomorrow, time: '14:00', duration: 45, price: 2100, status: 'confirmed', extra: 'Комплекс перед мероприятием', channel: 'Постоянный' }
      ]
    },

    fitness: {
      id: 'fitness',
      name: 'Фитнес-клуб',
      shortName: 'Фитнес-клуб',
      defaultBusinessName: 'Pulse Athletic Club',
      address: 'Ленинградский пр-т, 48',
      phone: '+7 (495) 600-77-90',
      hours: '07:00 — 23:00',
      icon: 'dumbbell',
      accent: '#059669',
      accentHover: '#047857',
      accentSoft: 'rgba(5, 150, 105, 0.12)',
      accentRing: 'rgba(5, 150, 105, 0.24)',
      tagline: 'Абонементы, персональные тренировки, загрузка залов и продления',
      terms: {
        bookingSingular: 'Тренировка',
        bookingsPlural: 'Тренировки',
        createBooking: 'Записать на тренировку',
        clientSingular: 'Член клуба',
        clientsPlural: 'Члены клуба',
        staffSingular: 'Тренер',
        staffPlural: 'Тренеры',
        resourceCol: 'Тренеры и залы',
        serviceTab: 'Абонементы и слоты',
        productTab: 'Спортпит и бар',
        extraFieldLabel: 'Зал / Абонемент',
        extraFieldPlaceholder: 'Напр.: Зал Функционал, карта Gold',
        statusMap: {
          confirmed: 'Подтверждена',
          pending: 'Резерв',
          in_progress: 'В зале',
          completed: 'Проведена',
          cancelled: 'Отмена'
        }
      },
      kpis: [
        { label: 'Выручка сегодня', base: 112500, delta: '+16.5%', up: true, icon: 'wallet', spark: [78, 84, 89, 95, 92, 104, 112], format: 'money' },
        { label: 'Активные абонементы', value: '412', delta: '+24 за мес', up: true, icon: 'clients', spark: [370, 378, 385, 391, 398, 405, 412], format: 'text' },
        { label: 'Загрузка залов', value: '79%', delta: '+5.2%', up: true, icon: 'calendar', spark: [64, 68, 70, 72, 74, 77, 79], format: 'text' },
        { label: 'Продления карт', value: '86%', delta: '+2.8%', up: true, icon: 'trending', spark: [80, 81, 82, 84, 83, 85, 86], format: 'text' }
      ],
      insights: [
        { type: 'warning', title: 'У 14 резидентов истекает карта через 7 дней', desc: 'Персональное предложение на продление повышает конверсию на 38%.' },
        { type: 'success', title: 'Вечерний HIIT и Pilates заполнены на 95%', desc: 'Рекомендуем добавить дублирующий класс в 19:30 в Зал №2.' },
        { type: 'accent', title: 'Выручка фитнес-бара +22% после тренировок', desc: 'Протеиновые коктейли чаще покупают клиенты персональных блоков.' }
      ],
      staff: [
        { id: 'st1', name: 'Дмитрий Тарасов', role: 'Мастер-тренер (Силовой)', status: 'В зале', busy: 90, rating: 4.98, bookingsCount: 134, revenue: 392000, commission: '50%', schedule: '08:00 — 20:00', tags: ['Гипертрофия', 'Реабилитация'] },
        { id: 'st2', name: 'Елена Соболева', role: 'Тренер Pilates & Stretch', status: 'На смене', busy: 84, rating: 4.95, bookingsCount: 108, revenue: 286000, commission: '45%', schedule: '09:00 — 21:00', tags: ['Реформер', 'Здоровая спина'] },
        { id: 'st3', name: 'Артур Каримов', role: 'Кроссфит / HIIT', status: 'Свободен', busy: 76, rating: 4.89, bookingsCount: 92, revenue: 234000, commission: '45%', schedule: '10:00 — 22:00', tags: ['HIIT', 'Функционал'] }
      ],
      services: [
        { id: 'sv1', kind: 'service', name: 'Персональная тренировка (60 мин)', category: 'Персональные', price: 3500, duration: 60, cost: 1600, active: true, popular: 94 },
        { id: 'sv2', kind: 'service', name: 'Блок 10 тренировок PRO', category: 'Пакеты', price: 31000, duration: 60, cost: 13500, active: true, popular: 86 },
        { id: 'sv3', kind: 'service', name: 'Групповой класс Pilates Reformer', category: 'Групповые', price: 1800, duration: 55, cost: 450, active: true, popular: 91 },
        { id: 'sv4', kind: 'service', name: 'Клубная карта Безлимит 1 мес', category: 'Абонементы', price: 7900, duration: 60, cost: 1200, active: true, popular: 89 },
        { id: 'sv5', kind: 'product', name: 'Изолят протеина Whey Gold 900г', category: 'Спортпит', price: 4200, stock: 9, minStock: 4, sku: 'PA-401', cost: 2600, active: true },
        { id: 'sv6', kind: 'product', name: 'Изотоник + BCAA (бар)', category: 'Фитнес-бар', price: 420, stock: 4, minStock: 10, sku: 'PA-012', cost: 140, active: true }
      ],
      clients: [
        { id: 'cl1', name: 'Сергей Власов', phone: '+7 (916) 881-20-15', segment: 'VIP', visits: 48, ltv: 186000, lastVisit: today, note: 'Карта Год Безлимит до 15.05. Цель: марафон.', tag: 'Карта Gold активна' },
        { id: 'cl2', name: 'Марина Ковалёва', phone: '+7 (926) 509-44-18', segment: 'Постоянный', visits: 22, ltv: 64200, lastVisit: yesterday, note: 'Ходит на Pilates Reformer Вт/Чт.', tag: 'Осталось 4 занятия' },
        { id: 'cl3', name: 'Павел Жуков', phone: '+7 (905) 312-90-77', segment: 'Новый', visits: 2, ltv: 9700, lastVisit: today, note: 'Пробная персональная + старт-абонемент.', tag: 'InBody пройден' },
        { id: 'cl4', name: 'Алина Егорова', phone: '+7 (985) 114-63-29', segment: 'Спящий', visits: 14, ltv: 45000, lastVisit: isoDay(-27), note: 'Абонемент заканчивается через 5 дней.', tag: 'Риск оттока' }
      ],
      bookings: [
        { id: 'bk1', clientId: 'cl1', staffId: 'st1', serviceId: 'sv1', date: today, time: '10:00', duration: 60, price: 3500, status: 'completed', extra: 'Тренажёрный зал • Прогрессия весов', channel: 'Приложение' },
        { id: 'bk2', clientId: 'cl2', staffId: 'st2', serviceId: 'sv3', date: today, time: '12:00', duration: 60, price: 1800, status: 'in_progress', extra: 'Студия Reformer • Место 3', channel: 'Приложение' },
        { id: 'bk3', clientId: 'cl3', staffId: 'st3', serviceId: 'sv1', date: today, time: '15:00', duration: 60, price: 3500, status: 'confirmed', extra: 'Зона Кроссфит • Вводная', channel: 'Рецепция' },
        { id: 'bk4', clientId: 'cl1', staffId: 'st1', serviceId: 'sv1', date: tomorrow, time: '10:00', duration: 60, price: 3500, status: 'confirmed', extra: 'Тренажёрный зал', channel: 'Приложение' }
      ]
    },

    clinic: {
      id: 'clinic',
      name: 'Клиника',
      shortName: 'Клиника',
      defaultBusinessName: 'MedCore Clinic',
      address: 'ул. Остоженка, 37',
      phone: '+7 (495) 770-03-03',
      hours: '08:00 — 21:00',
      icon: 'stethoscope',
      accent: '#0284c7',
      accentHover: '#0369a1',
      accentSoft: 'rgba(2, 132, 199, 0.12)',
      accentRing: 'rgba(2, 132, 199, 0.24)',
      tagline: 'Приёмы врачей, загрузка кабинетов, амбулаторные карты и диагностика',
      terms: {
        bookingSingular: 'Приём',
        bookingsPlural: 'Приёмы',
        createBooking: 'Записать пациента',
        clientSingular: 'Пациент',
        clientsPlural: 'Пациенты',
        staffSingular: 'Врач',
        staffPlural: 'Врачи',
        resourceCol: 'Врачи и кабинеты',
        serviceTab: 'Медуслуги и приёмы',
        productTab: 'Препараты и аптека',
        extraFieldLabel: 'Кабинет / Повод обращения',
        extraFieldPlaceholder: 'Напр.: Каб. 204, первичный осмотр, ДМС',
        statusMap: {
          confirmed: 'Подтверждён',
          pending: 'Ожидает',
          in_progress: 'На приёме',
          completed: 'Завершён',
          cancelled: 'Отмена'
        }
      },
      kpis: [
        { label: 'Оборот за день', base: 148600, delta: '+12.8%', up: true, icon: 'wallet', spark: [108, 118, 124, 130, 129, 141, 148], format: 'money' },
        { label: 'Приёмов сегодня', value: '34 / 38', delta: '89% слотов', up: true, icon: 'calendar', spark: [24, 27, 28, 30, 29, 32, 34], format: 'text' },
        { label: 'Средний чек приёма', base: 4370, delta: '+6.4%', up: true, icon: 'trending', spark: [3800, 3950, 4050, 4100, 4200, 4300, 4370], format: 'money' },
        { label: 'Первичные пациенты', value: '28%', delta: '+4.0%', up: true, icon: 'clients', spark: [21, 22, 24, 25, 25, 27, 28], format: 'text' }
      ],
      insights: [
        { type: 'accent', title: 'Кабинет УЗИ загружен на 94% до конца недели', desc: 'Рекомендуем открыть утренний слот 08:00–10:00 в субботу.' },
        { type: 'warning', title: '5 пациентов без повторного приёма после анализов', desc: 'Результаты готовы — администратор может предложить телемедицину.' },
        { type: 'success', title: 'Среднее время ожидания в холле — 4 минуты', desc: 'Задержек по расписанию врачей сегодня не зафиксировано.' }
      ],
      staff: [
        { id: 'st1', name: 'Д-р Андрей Беляев', role: 'Терапевт / Кардиолог', status: 'На приёме', busy: 91, rating: 4.98, bookingsCount: 142, revenue: 540000, commission: '35%', schedule: '09:00 — 18:00', tags: ['Каб. 102', 'ЭКГ / Чек-ап'] },
        { id: 'st2', name: 'Д-р Ирина Зайцева', role: 'Врач УЗИ и диагностики', status: 'На смене', busy: 94, rating: 4.96, bookingsCount: 156, revenue: 618000, commission: '38%', schedule: '08:30 — 19:00', tags: ['Каб. 204', 'УЗИ эксперт'] },
        { id: 'st3', name: 'Д-р Михаил Князев', role: 'Стоматолог-ортопед', status: 'Свободен', busy: 82, rating: 4.93, bookingsCount: 88, revenue: 790000, commission: '40%', schedule: '10:00 — 20:00', tags: ['Каб. 301', 'Имплантология'] }
      ],
      services: [
        { id: 'sv1', kind: 'service', name: 'Первичная консультация специалиста', category: 'Терапия', price: 3500, duration: 45, cost: 900, active: true, popular: 95 },
        { id: 'sv2', kind: 'service', name: 'УЗИ органов брюшной полости', category: 'Диагностика', price: 4200, duration: 45, cost: 1050, active: true, popular: 90 },
        { id: 'sv3', kind: 'service', name: 'Комплексный Check-Up «Базовый»', category: 'Программы', price: 14900, duration: 90, cost: 4200, active: true, popular: 82 },
        { id: 'sv4', kind: 'service', name: 'Профессиональная гигиена полости рта', category: 'Стоматология', price: 6500, duration: 60, cost: 1700, active: true, popular: 87 },
        { id: 'sv5', kind: 'product', name: 'Витаминно-минеральный комплекс D3+K2', category: 'Аптека', price: 2150, stock: 16, minStock: 5, sku: 'MC-502', cost: 1100, active: true },
        { id: 'sv6', kind: 'product', name: 'Реминерализующий гель ROCS Medical', category: 'Уход', price: 890, stock: 3, minStock: 8, sku: 'MC-114', cost: 430, active: true }
      ],
      clients: [
        { id: 'cl1', name: 'Наталья Крылова', phone: '+7 (916) 334-71-09', segment: 'VIP', visits: 12, ltv: 96400, lastVisit: isoDay(-5), note: 'Медкарта #4182. Полис ДМС СОГАЗ.', tag: 'ДМС активен' },
        { id: 'cl2', name: 'Виктор Тихонов', phone: '+7 (926) 901-44-32', segment: 'Постоянный', visits: 6, ltv: 38200, lastVisit: today, note: 'Годовой Check-Up, контроль давления.', tag: 'Анализы готовы' },
        { id: 'cl3', name: 'Светлана Полякова', phone: '+7 (903) 782-15-64', segment: 'Новый', visits: 1, ltv: 4200, lastVisit: today, note: 'Первичный приём по направлению на УЗИ.', tag: 'Первичный' },
        { id: 'cl4', name: 'Олег Воронов', phone: '+7 (915) 204-88-19', segment: 'Спящий', visits: 4, ltv: 24500, lastVisit: isoDay(-48), note: 'Плановый осмотр стоматолога раз в 6 мес.', tag: 'Напомнить о гигиене' }
      ],
      bookings: [
        { id: 'bk1', clientId: 'cl2', staffId: 'st1', serviceId: 'sv1', date: today, time: '10:00', duration: 45, price: 3500, status: 'completed', extra: 'Каб. 102 • Плановый контроль', channel: 'Колл-центр' },
        { id: 'bk2', clientId: 'cl3', staffId: 'st2', serviceId: 'sv2', date: today, time: '12:00', duration: 45, price: 4200, status: 'in_progress', extra: 'Каб. 204 • Первичный осмотр', channel: 'Сайт клиники' },
        { id: 'bk3', clientId: 'cl1', staffId: 'st3', serviceId: 'sv4', date: today, time: '14:30', duration: 60, price: 6500, status: 'confirmed', extra: 'Каб. 301 • По ДМС', channel: 'Постоянный' },
        { id: 'bk4', clientId: 'cl4', staffId: 'st1', serviceId: 'sv3', date: tomorrow, time: '11:00', duration: 90, price: 14900, status: 'pending', extra: 'Каб. 102 • Натощак', channel: 'ПроДокторов' }
      ]
    },

    restaurant: {
      id: 'restaurant',
      name: 'Ресторан',
      shortName: 'Ресторан',
      defaultBusinessName: 'Osteria Verde',
      address: 'Б. Никитская, 19',
      phone: '+7 (495) 510-92-10',
      hours: '11:00 — 23:30',
      icon: 'utensils',
      accent: '#ea580c',
      accentHover: '#c2410c',
      accentSoft: 'rgba(234, 88, 12, 0.12)',
      accentRing: 'rgba(234, 88, 12, 0.24)',
      tagline: 'Бронирования столов, загрузка залов, меню, средний чек и официанты',
      terms: {
        bookingSingular: 'Бронь стола',
        bookingsPlural: 'Брони столов',
        createBooking: 'Забронировать стол',
        clientSingular: 'Гость',
        clientsPlural: 'Гости',
        staffSingular: 'Официант / Хост',
        staffPlural: 'Команда зала',
        resourceCol: 'Залы и хост',
        serviceTab: 'Блюда и дегустации',
        productTab: 'Бар и витрина',
        extraFieldLabel: 'Стол / Кол-во гостей',
        extraFieldPlaceholder: 'Напр.: Стол №7 (у окна), 4 гостя',
        statusMap: {
          confirmed: 'Подтверждена',
          pending: 'Ожидает хоста',
          in_progress: 'За столом',
          completed: 'Чек закрыт',
          cancelled: 'Снята'
        }
      },
      kpis: [
        { label: 'Выручка смены', base: 234500, delta: '+18.1%', up: true, icon: 'wallet', spark: [165, 178, 182, 198, 210, 221, 234], format: 'money' },
        { label: 'Загрузка столов', value: '24 / 28', delta: '86% зал', up: true, icon: 'calendar', spark: [16, 18, 19, 21, 20, 23, 24], format: 'text' },
        { label: 'Средний чек стола', base: 6450, delta: '+9.5%', up: true, icon: 'trending', spark: [5400, 5650, 5900, 6100, 6200, 6350, 6450], format: 'money' },
        { label: 'Оборачиваемость', value: '3.2x', delta: '+0.4x', up: true, icon: 'clock', spark: [2.5, 2.7, 2.8, 2.9, 3.0, 3.1, 3.2], format: 'text' }
      ],
      insights: [
        { type: 'accent', title: 'Ужин 19:00–21:30 забронирован на 92%', desc: 'Остались 2 стола на террасе с обогревом и 1 VIP-кабина.' },
        { type: 'success', title: 'Трюфельная паста и стейк Рибай — лидеры маржи', desc: 'Приносят 34% выручки кухни при фудкосте 24%.' },
        { type: 'warning', title: 'Заканчивается Пино Нуар резерв на баре', desc: 'Осталось 3 бутылки — требуется перемещение со склада.' }
      ],
      staff: [
        { id: 'st1', name: 'Антон Соловьёв', role: 'Старший официант (Основной зал)', status: 'В зале', busy: 90, rating: 4.96, bookingsCount: 165, revenue: 742000, commission: 'Чаевые + 5%', schedule: '11:00 — 23:00', tags: ['Столы 1–8', 'Винный пейринг'] },
        { id: 'st2', name: 'Ксения Орлова', role: 'Хостес / Менеджер броней', status: 'На смене', busy: 85, rating: 4.94, bookingsCount: 210, revenue: 510000, commission: 'Оклад + KPI', schedule: '11:00 — 23:00', tags: ['Встреча гостей', 'VIP-зал'] },
        { id: 'st3', name: 'Марк Лисицын', role: 'Сомелье / Бар', status: 'Свободен', busy: 76, rating: 4.92, bookingsCount: 118, revenue: 625000, commission: '7% бар', schedule: '14:00 — 23:30', tags: ['Винная карта', 'Дегустации'] }
      ],
      services: [
        { id: 'sv1', kind: 'service', name: 'Сет-ужин от шефа (5 курсов)', category: 'Гастрономия', price: 7800, duration: 120, cost: 2100, active: true, popular: 91 },
        { id: 'sv2', kind: 'service', name: 'Бронь VIP-кабины с сервировкой', category: 'Банкеты', price: 15000, duration: 180, cost: 3400, active: true, popular: 78 },
        { id: 'sv3', kind: 'service', name: 'Стейк Рибай Prime + гарнир', category: 'Горячее', price: 4200, duration: 60, cost: 1280, active: true, popular: 95 },
        { id: 'sv4', kind: 'service', name: 'Трюфельная паста Таглиолини', category: 'Паста', price: 1850, duration: 45, cost: 430, active: true, popular: 93 },
        { id: 'sv5', kind: 'product', name: 'Pinot Noir Reserve (бутылка)', category: 'Винная карта', price: 6900, stock: 3, minStock: 6, sku: 'OV-701', cost: 2900, active: true },
        { id: 'sv6', kind: 'product', name: 'Оливковое масло Extra Virgin 500мл', category: 'Гастролавка', price: 2400, stock: 12, minStock: 4, sku: 'OV-108', cost: 1150, active: true }
      ],
      clients: [
        { id: 'cl1', name: 'Глеб Артемьев', phone: '+7 (916) 990-12-40', segment: 'VIP', visits: 21, ltv: 194000, lastVisit: isoDay(-2), note: 'Любит стол №4 у камина. Аллергия на орехи.', tag: 'Карта гостя 15%' },
        { id: 'cl2', name: 'Полина Ветрова', phone: '+7 (925) 412-08-73', segment: 'Постоянный', visits: 9, ltv: 58300, lastVisit: today, note: 'Часто проводит деловые обеды по будням.', tag: 'Безнал / счёт' },
        { id: 'cl3', name: 'Тимур Азизов', phone: '+7 (903) 615-39-22', segment: 'Новый', visits: 1, ltv: 7800, lastVisit: today, note: 'Юбилей — комплимент от шефа.', tag: 'День рождения' },
        { id: 'cl4', name: 'Вера Носова', phone: '+7 (910) 533-77-10', segment: 'Спящий', visits: 5, ltv: 31200, lastVisit: isoDay(-38), note: 'Была на винной дегустации в прошлом месяце.', tag: 'Пригласить на ужин' }
      ],
      bookings: [
        { id: 'bk1', clientId: 'cl2', staffId: 'st1', serviceId: 'sv3', date: today, time: '13:00', duration: 90, price: 4200, status: 'completed', extra: 'Стол №2 • Деловой обед (2 гостя)', channel: 'Яндекс Карты' },
        { id: 'bk2', clientId: 'cl1', staffId: 'st2', serviceId: 'sv1', date: today, time: '15:00', duration: 120, price: 7800, status: 'in_progress', extra: 'Стол №4 у камина • 2 гостя', channel: 'Постоянный' },
        { id: 'bk3', clientId: 'cl3', staffId: 'st3', serviceId: 'sv2', date: today, time: '19:00', duration: 150, price: 15000, status: 'confirmed', extra: 'VIP-кабина • 6 гостей, торт', channel: 'Телефон' },
        { id: 'bk4', clientId: 'cl4', staffId: 'st1', serviceId: 'sv4', date: tomorrow, time: '18:30', duration: 90, price: 3700, status: 'pending', extra: 'Терраса №8 • 2 гостя', channel: 'Сайт' }
      ]
    },

    retail: {
      id: 'retail',
      name: 'Магазин',
      shortName: 'Магазин',
      defaultBusinessName: 'Nordic Concept Store',
      address: 'ул. М. Бронная, 15',
      phone: '+7 (495) 228-64-11',
      hours: '10:00 — 22:00',
      icon: 'bag',
      accent: '#4f46e5',
      accentHover: '#4338ca',
      accentSoft: 'rgba(79, 70, 229, 0.11)',
      accentRing: 'rgba(79, 70, 229, 0.22)',
      tagline: 'Заказы, самовывоз и примерки, остатки склада, маржа и покупатели',
      terms: {
        bookingSingular: 'Заказ / Бронь',
        bookingsPlural: 'Заказы и выдачи',
        createBooking: 'Новый заказ',
        clientSingular: 'Покупатель',
        clientsPlural: 'Покупатели',
        staffSingular: 'Консультант',
        staffPlural: 'Продавцы',
        resourceCol: 'Менеджеры и кассы',
        serviceTab: 'Доп. сервисы',
        productTab: 'Каталог и склад',
        extraFieldLabel: 'Пункт выдачи / Доставка',
        extraFieldPlaceholder: 'Напр.: Примерка в шоуруме, заказ #841',
        statusMap: {
          confirmed: 'Собран',
          pending: 'Новый заказ',
          in_progress: 'На примерке',
          completed: 'Выдан / Оплачен',
          cancelled: 'Возврат'
        }
      },
      kpis: [
        { label: 'Оборот сегодня', base: 164900, delta: '+21.3%', up: true, icon: 'wallet', spark: [110, 121, 130, 138, 145, 156, 165], format: 'money' },
        { label: 'Заказов в работе', value: '19', delta: '6 на выдачу', up: true, icon: 'bookings', spark: [11, 13, 14, 15, 16, 17, 19], format: 'text' },
        { label: 'Средний чек', base: 8680, delta: '+8.4%', up: true, icon: 'trending', spark: [7200, 7500, 7900, 8100, 8300, 8500, 8680], format: 'money' },
        { label: 'Валовая маржа', value: '54%', delta: '+2.1%', up: true, icon: 'analytics', spark: [49, 50, 51, 52, 52, 53, 54], format: 'text' }
      ],
      insights: [
        { type: 'warning', title: '2 позиции достигли критического остатка', desc: 'Кроссовки Studio Run (2 пары) и рюкзак City Pack (3 шт) требуют дозаказа.' },
        { type: 'success', title: 'Конверсия примерок по записи — 78%', desc: 'Покупатели с бронью стилиста покупают в среднем на 45% больше.' },
        { type: 'accent', title: 'Осенний дроп даёт 61% всей выручки недели', desc: 'Пик выдач самовывоза приходится на 17:00–20:00.' }
      ],
      staff: [
        { id: 'st1', name: 'Яна Филатова', role: 'Старший стилист-консультант', status: 'На смене', busy: 88, rating: 4.97, bookingsCount: 124, revenue: 890000, commission: '6%', schedule: '10:00 — 21:00', tags: ['Персональный шопинг', 'Шоурум'] },
        { id: 'st2', name: 'Никита Чернов', role: 'Менеджер заказов и склада', status: 'На выдаче', busy: 82, rating: 4.91, bookingsCount: 158, revenue: 645000, commission: '4%', schedule: '10:00 — 22:00', tags: ['Самовывоз', 'Курьеры'] },
        { id: 'st3', name: 'Алиса Грин', role: 'Продавец-консультант', status: 'Свободна', busy: 74, rating: 4.88, bookingsCount: 93, revenue: 472000, commission: '5%', schedule: '11:00 — 22:00', tags: ['Касса', 'Подарочные наборы'] }
      ],
      services: [
        { id: 'sv1', kind: 'product', name: 'Шерстяное пальто Oslo Oversize', category: 'Верхняя одежда', price: 24900, stock: 7, minStock: 3, sku: 'NC-881', cost: 11200, active: true },
        { id: 'sv2', kind: 'product', name: 'Кроссовки Studio Run Minimal', category: 'Обувь', price: 14500, stock: 2, minStock: 5, sku: 'NC-412', cost: 6800, active: true },
        { id: 'sv3', kind: 'product', name: 'Рюкзак City Pack Waterproof', category: 'Аксессуары', price: 9800, stock: 3, minStock: 6, sku: 'NC-205', cost: 4300, active: true },
        { id: 'sv4', kind: 'product', name: 'Худи Heavy Cotton 480gsm', category: 'Трикотаж', price: 7900, stock: 21, minStock: 8, sku: 'NC-109', cost: 3200, active: true },
        { id: 'sv5', kind: 'service', name: 'Персональный подбор капсулы со стилистом', category: 'Сервисы', price: 0, duration: 60, cost: 0, active: true, popular: 89 },
        { id: 'sv6', kind: 'service', name: 'Подарочная упаковка и гравировка', category: 'Сервисы', price: 950, duration: 30, cost: 220, active: true, popular: 76 }
      ],
      clients: [
        { id: 'cl1', name: 'Андрей Кузьмин', phone: '+7 (916) 740-19-88', segment: 'VIP', visits: 16, ltv: 218000, lastVisit: yesterday, note: 'Размер L, предпочитает предзаказы новых дропов.', tag: 'VIP-клуб 10%' },
        { id: 'cl2', name: 'Дарья Соколова', phone: '+7 (926) 318-55-41', segment: 'Постоянный', visits: 8, ltv: 74500, lastVisit: today, note: 'Часто оформляет самовывоз с примеркой.', tag: 'Подписка на дропы' },
        { id: 'cl3', name: 'Евгений Марков', phone: '+7 (903) 912-07-63', segment: 'Новый', visits: 1, ltv: 14500, lastVisit: today, note: 'Заказ с сайта #841 — оплачен онлайн.', tag: 'Онлайн-заказ' },
        { id: 'cl4', name: 'Ирина Мельник', phone: '+7 (985) 607-24-15', segment: 'Спящий', visits: 4, ltv: 39200, lastVisit: isoDay(-45), note: 'Интересовалась новой осенней коллекцией.', tag: 'Отправить лукбук' }
      ],
      bookings: [
        { id: 'bk1', clientId: 'cl2', staffId: 'st1', serviceId: 'sv1', date: today, time: '11:30', duration: 60, price: 24900, status: 'in_progress', extra: 'Примерочная №1 • Размеры S и M', channel: 'Сайт' },
        { id: 'bk2', clientId: 'cl3', staffId: 'st2', serviceId: 'sv2', date: today, time: '13:00', duration: 45, price: 14500, status: 'confirmed', extra: 'Самовывоз #841 • Оплачен', channel: 'Интернет-магазин' },
        { id: 'bk3', clientId: 'cl1', staffId: 'st1', serviceId: 'sv3', date: today, time: '16:00', duration: 60, price: 9800, status: 'pending', extra: 'Шоурум • Бронь до 18:00', channel: 'Telegram' },
        { id: 'bk4', clientId: 'cl4', staffId: 'st3', serviceId: 'sv4', date: tomorrow, time: '12:30', duration: 45, price: 7900, status: 'confirmed', extra: 'Подарочная упаковка', channel: 'Instagram' }
      ]
    }
  };

  window.BizNiches = {
    NICHES,
    NICHE_ORDER: ['barbershop', 'salon', 'fitness', 'clinic', 'restaurant', 'retail'],
    today,
    tomorrow,
    yesterday,
    isoDay
  };
})();
