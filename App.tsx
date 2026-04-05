import React, { useState, useRef, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { OracleState, OracleResponse, HistoryItem, Perspective, LearningProfile } from './types';
import { consultOracle, regenerateOracleImage, translateOracleResponse, speakText, fetchPerspectiveAnalysis, stopSpeaking } from './services/oracleService';
import { RatioIndicator } from './components/RatioIndicator';
import { LoadingScreen } from './components/LoadingScreen';
import { ThemeBackground } from './components/ThemeBackground';

type Theme = 'SUPREMATIST' | 'IMPRESSIONIST';
type Language = 'EN' | 'RU';
type FrameworkType = 'DEFAULT' | 'PSYCHOANALYSIS' | 'GESTALT' | 'RUSSIAN' | 'GERMAN' | 'EXISTENTIAL' | 'THEOLOGICAL' | 'BUDDHIST' | 'POST_MODERN' | 'ANCIENT_GREEKS' | 'ANCIENT_ROMANS';

const frameworkKeyMap: Record<FrameworkType, string> = {
  DEFAULT: "default",
  PSYCHOANALYSIS: "psychoanalysis",
  GESTALT: "gestalt",
  RUSSIAN: "russian_philosophy",
  GERMAN: "german_philosophy",
  EXISTENTIAL: "existential",
  THEOLOGICAL: "theological",
  BUDDHIST: "buddhist",
  POST_MODERN: "post_modern",
  ANCIENT_GREEKS: "ancient_greeks",
  ANCIENT_ROMANS: "ancient_romans"
};

const perspectivesList = [
  { id: 'psy', label: 'Psychoanalysis', frameworkType: 'PSYCHOANALYSIS' as FrameworkType },
  { id: 'ges', label: 'Gestalt', frameworkType: 'GESTALT' as FrameworkType },
  { id: 'rus', label: 'Russian Philosophy', frameworkType: 'RUSSIAN' as FrameworkType },
  { id: 'ger', label: 'German Philosophy', frameworkType: 'GERMAN' as FrameworkType },
  { id: 'exi', label: 'Existentialism', frameworkType: 'EXISTENTIAL' as FrameworkType },
  { id: 'the', label: 'Theology', frameworkType: 'THEOLOGICAL' as FrameworkType },
  { id: 'bud', label: 'Zen Buddhism', frameworkType: 'BUDDHIST' as FrameworkType },
  { id: 'pm', label: 'Post-Modernism', frameworkType: 'POST_MODERN' as FrameworkType },
  { id: 'grk', label: 'Ancient Greeks', frameworkType: 'ANCIENT_GREEKS' as FrameworkType },
  { id: 'rom', label: 'Ancient Romans', frameworkType: 'ANCIENT_ROMANS' as FrameworkType },
];

const SUGGESTIONS_POOLS = {
  EN: [
    "What should I watch tonight?", "A niche world cinema movie", "A non-fiction book to expand my mind", "A meal to cure existential dread", "A travel destination for a solo soul", "Minimalism vs Baroque lifestyle", "Should I forgive my old self?", "A documentary about hidden realities", "The ethics of artificial love", "A playlist for a rainy dialectic", "A video game with soul", "How to stop running from silence?", "An experimental film for a Sunday", "Russian vs French literature", "Should I move to the countryside?", "The meaning of constant movement", "A cocktail for a post-modern gala", "Architecture for a future home", "Zen path vs Western ambition", "Is chaos a ladder or a hole?", "A gift for a philosopher", "A radical career change?", "Cinema from the Global South", "A poem for a broken clock", "Philosophy of digital identity", "A hobby that isn't productive", "Modern art vs Classicism", "The beauty of unfinished work", "A ritual for the new moon", "Should I speak or be silent?", "A book about forgotten gods", "The last dream of a machine", "A recipe for a revolution", "Shadow work vs Light work", "Post-human fashion trends", "The sound of one clapping hand", "A hike through the uncanny valley", "Why do we build monuments?", "A letter to my 100-year-old self", "The metaphysics of jazz", "Cybernetics and the soul", "A research paper to flip my worldview", "A rare 90s techno track", "A brutalist building to visit", "Obscure mythological figures", "A painting to meditate on", "The smell of forgotten libraries", "Quantum physics for the lonely", "A tool for creative destruction"
  ],
  RU: [
    "Что мне посмотреть сегодня?", "Редкое мировое кино", "Нон-фикшн книга для расширения кругозора", "Блюдо от экзистенциальной тоски", "Направление для путешествия одинокой души", "Минимализм или барокко?", "Стоит ли мне простить себя прежнего?", "Документалка о скрытой реальности", "Этика искусственной любви", "Плейлист для дождливой диалектики", "Видеоигра с душой", "Как перестать бежать от тишины?", "Экспериментальный фильм на воскресенье", "Русская или французская литература?", "Стоит ли мне переехать в деревню?", "Смысл вечного движения", "Коктейль для постмодернистского бала", "Архитектура для будущего дома", "Путь дзен против западных амбиций", "Хаос — это лестница или дыра?", "Подарок для незнакомца", "Радикальная смена карьеры?", "Кино стран Глобального Юга", "Стихотворение для сломанных часов", "Философия цифровой идентичности", "Хобби, которое не приносит пользы", "Современное искусство против классики", "Красота незавершенной работы", "Ритуал на новолуние", "Говорить или молчать?", "Книга о забытых богах", "Последний сон машины", "Рецепт революции", "Научная статья, меняющая мир", "Редкий техно-трек 90-х", "Бруталистское здание для визита", "Забытые мифологические фигуры", "Картина для медитации", "Запах забытых библиотек", "Квантовая физика для одиноких", "Инструмент для созидательного разрушения"
  ]
};

const ORACLE_CURIOSITIES = {
  EN: [
    { title: "The Color of Pomegranates", desc: "A visual feast of Armenian surrealism by Sergei Parajanov, exploring the life of a poet.", query: "The Color of Pomegranates film" },
    { title: "The Long Now Foundation", desc: "A movement fostering long-term thinking for the next 10,000 years, away from short-termism.", query: "The Long Now Foundation" },
    { title: "Invisible Cities", desc: "Italo Calvino's poetic exploration of the imagination through 55 fictional cities.", query: "Invisible Cities Italo Calvino" },
    { title: "The Voynich Manuscript", desc: "An illustrated codex hand-written in an unknown writing system that remains unsolved.", query: "The Voynich Manuscript mystery" },
    { title: "Stalker", desc: "Andrei Tarkovsky's meditative journey through the Zone in search of one's deepest desires.", query: "Stalker film Tarkovsky" },
    { title: "Solarpunk", desc: "An aesthetic and movement envisioning a sustainable, equitable future through high-tech and nature.", query: "Solarpunk aesthetic movement" },
    { title: "The Invention of Morel", desc: "Adolfo Bioy Casares' niche masterpiece about immortality, images, and unrequited love.", query: "The Invention of Morel book" },
    { title: "Koyaanisqatsi", desc: "A cinematic poem on 'life out of balance', showing the collision of nature and technology.", query: "Koyaanisqatsi film Philip Glass" },
    { title: "Atlas Obscura", desc: "A guide to the world's most hidden, wondrous, and strange places.", query: "Atlas Obscura most strange places" },
    { title: "Resident Advisor", desc: "The definitive archive of electronic music and global club culture.", query: "Resident Advisor electronic music history" },
    { title: "The Museum of Jurassic Technology", desc: "A specialized repository of curiosities that blurs the line between fact and fiction.", query: "The Museum of Jurassic Technology" },
    { title: "Zettelkasten Method", desc: "A personal tool for thinking and writing that creates a network of interconnected notes.", query: "Zettelkasten method for creativity" },
    { title: "Hyperobjects", desc: "Entities of such vast temporal and spatial dimensions that they defy human perception.", query: "Hyperobjects Timothy Morton" },
    { title: "The Situationist International", desc: "A revolutionary group of avant-garde artists and intellectuals focused on the 'spectacle'.", query: "The Situationist International movement" },
    { title: "Asemic Writing", desc: "A wordless open semantic form of writing that has no specific meaning but high emotional impact.", query: "Asemic writing art" },
    { title: "The Library of Babel", desc: "A short story by Jorge Luis Borges conceiving a universe in the form of a vast library.", query: "The Library of Babel Borges" },
    { title: "Antifragility", desc: "A property of systems that thrive and grow when exposed to volatility and disorder.", query: "Antifragility Nassim Taleb" },
    { title: "The Overview Effect", desc: "A cognitive shift in awareness reported by some astronauts during spaceflight.", query: "The Overview Effect space" },
    { title: "Psychogeography", desc: "The study of the specific effects of the geographical environment on the emotions of individuals.", query: "Psychogeography Guy Debord" },
    { title: "Dark Forest Hypothesis", desc: "A terrifying solution to the Fermi Paradox suggesting civilizations remain hidden out of fear.", query: "Dark Forest hypothesis Fermi paradox" },
    { title: "The Red Book", desc: "C.G. Jung's record of his private 'confrontation with the unconscious', filled with vibrant art.", query: "The Red Book Jung" },
    { title: "Oulipo", desc: "A workshop of potential literature using canned writing techniques to trigger creativity.", query: "Oulipo literature constraints" },
    { title: "Ghost in the Machine", desc: "The concept of the mind as a separate entity from the physical body, as critiqued by Gilbert Ryle.", query: "Ghost in the Machine philosophy" },
    { title: "Hauntology", desc: "The return or persistence of elements from the past, as in the manner of a ghost.", query: "Hauntology Mark Fisher" },
    { title: "Metropolis", desc: "Fritz Lang's 1927 pioneering science fiction film about a stylized futuristic city.", query: "Metropolis Fritz Lang film" },
    { title: "Tashkent Modernism", desc: "A unique architectural movement blending Soviet brutalism with Central Asian motifs.", query: "Soviet Modernism in Tashkent" },
    { title: "Biopunk", desc: "A subgenre of science fiction focusing on the social and political implications of biotechnology.", query: "Biopunk genre movies books" }
  ],
  RU: [
    { title: "Цвет граната", desc: "Визуальный пир армянского сюрреализма Сергея Параджанова о жизни поэта Саят-Новы.", query: "фильм Цвет граната Параджанов" },
    { title: "Фонд Long Now", desc: "Движение, поощряющее долгосрочное мышление на 10 000 лет вперед, вопреки сиюминутности.", query: "The Long Now Foundation движение" },
    { title: "Невидимые города", desc: "Поэтическое исследование воображения Итало Кальвино через 55 вымышленных городов.", query: "Невидимые города Итало Кальвино" },
    { title: "Рукопись Войнича", desc: "Иллюстрированный кодекс, написанный на неизвестном языке, который до сих пор не расшифрован.", query: "Рукопись Войнича тайна" },
    { title: "Сталкер", desc: "Медитативное путешествие Андрея Тарковского через Зону в поисках самых сокровенных желаний.", query: "Сталкер фильм Тарковский" },
    { title: "Соларпанк", desc: "Эстетика и движение, представляющее устойчивое будущее через высокие технологии и природу.", query: "Соларпанк эстетика" },
    { title: "Изобретение Мореля", desc: "Нишевый шедевр Адольфо Биой Касареса о бессмертии, образах и безответной любви.", query: "Изобретение Мореля книга" },
    { title: "Койянискаци", desc: "Кинематографическая поема о «жизни вне баланса», показывающая столкновение природы и технологий.", query: "Койянискаци фильм" },
    { title: "Atlas Obscura", desc: "Путеводитель по самым скрытым, удивительным и странным местам мира.", query: "Atlas Obscura странные места" },
    { title: "Resident Advisor", desc: "Главный архив электронной музыки и мировой клубной культуры.", query: "Resident Advisor история техно" },
    { title: "Музей юрской технологии", desc: "Специализированное хранилище курьезов, стирающее грань между фактом и вымыслом.", query: "Музей юрской технологии" },
    { title: "Метод Цеттелькастен", desc: "Личный инструмент для мышления и письма, создающий сеть взаимосвязанных заметок.", query: "Метод Цеттелькастен для творчества" },
    { title: "Гиперобъекты", desc: "Объекты столь огромных временных и пространственных масштабов, что они не поддаются восприятию.", query: "Гиперобъекты Тимоти Мортон" },
    { title: "Ситуационистский Интернационал", desc: "Революционная группа художников и интеллектуалов, сосредоточенная на 'обществе спектакля'.", query: "Ситуационистский интернационал" },
    { title: "Асемическое письмо", desc: "Бессловесная открытая форма письма, не имеющая конкретного значения, но сильная эмоционально.", query: "Асемическое письмо искусство" },
    { title: "Вавилонская библиотека", desc: "Рассказ Борхеса, представляющий вселенную в виде огромной библиотеки всех возможных книг.", query: "Вавилонская библиотека Борхес" },
    { title: "Антихрупкость", desc: "Свойство систем процветать и расти при воздействии изменчивости, хаоса и беспорядра.", query: "Антихрупкость Нассим Талеб" },
    { title: "Эффект обзора", desc: "Критический сдвиг в осознании, о котором сообщают астронавты, глядя на Землю из космоса.", query: "Эффект обзора космос" },
    { title: "Психогеография", desc: "Изучение специфического воздействия географической среды на эмоции и поведение людей.", query: "Психогеография Ги Дебор" },
    { title: "Гипотеза Тёмного леса", desc: "Пугающее решение парадокса Ферми: цивилизации скрываются из страха перед другими.", query: "Гипотеза темного леса парадокс Ферми" },
    { title: "Красная книга Юнга", desc: "Запись его частной 'конфронтации с бессознательным', наполненная ярким искусством.", query: "Красная книга Юнга" },
    { title: "Улипо", desc: "Мастерская потенциальной литературы, использующая формальные ограничения для творчества.", query: "Улипо литература ограничения" },
    { title: "Призрак в машине", desc: "Концепция разума как отдельной сущности от тела, подвергнутая критике Гилбертом Райлом.", query: "Призрак в машине философия" },
    { title: "Хонтология", desc: "Возвращение или сохранение элементов прошлого, подобных призракам, в культуре и искусстве.", query: "Хонтология Mark Fisher" },
    { title: "Метрополис", desc: "Фритц Ланг 1927 года о футуристическом городе.", query: "фильм Метрополис Фриц Ланг" },
    { title: "Ташкентский модернизм", desc: "Уникальное архитектурное движение, сочетающее советский брутализм с восточными мотивами.", query: "Ташкентский советский модернизм" },
    { title: "Биопанк", desc: "Жанр научной фантастики, посвященный социальным и политическим последствиям биотехнологий.", query: "Биопанк книги фильмы" }
  ]
};

const TRANSLATIONS = {
  EN: {
    ask: "CONSULT", randomRequest: "RANDOM REQUEST", logic: "Logic", chaos: "Chaos", voidEmpty: "The void is silent", return: "Return", winner: "THE WINNER", essence: "THE ESSENCE", mantra: "THE MANTRA", decree: "THE DECREE", forecast: "THE FORECAST", gist: "THE GIST", prediction: "THE PREDICTION", decision: "THE CHOICE", recommendation: "RECOMMENDATION", readPerspectives: "EXPAND SYMPOSIUM", closeVerdict: "CLOSE", saveArtifact: "SAVE ARTEFACT", saveCard: "Save Card", saveImage: "Save Picture", newQuery: "NEW QUERY", sources: "Grounding Evidence", studyFurther: "STUDY FURTHER", imageLost: "Vision lost.", title: "The Oracle\nof Chance", footer: "Anti-Algorithm v1.5", errorMsg: "A paradox has occurred.", history: "HISTORY", optionA: "Option A", optionB: "Option B", translating: "Translating...",
    manualCalibration: "Calibration",
    cancelManual: "Cancel",
    backupWarning: "BACKUP MODE ENABLED",
    dailyContemplation: "Daily Contemplation",
    studyEvidence: "STUDY EVIDENCE",
    askAgain: "ROLL DICE AGAIN",
    loadingAnalysis: "Synthesizing Council Revelation...",
    councilTally: "Council Tally",
    councilConsensus: "Council Consensus",
    existentialResonance: "Existential Resonance",
    probabilityOccurrence: "Probability of Occurrence",
    councilResolve: "Council Resolve",
    ontologicalCore: "Synthesized Revelation",
    uncertaintyPrefix: "Borderline Query",
    councilOfPhilosophers: "Council of Philosophers",
    learningStyle: "Learning Style",
    profileActive: "Profile Active",
    cancelProfile: "Cancel Profile",
    startTest: "Begin Calibration",
    saveProfile: "Lock Pattern",
    modes: { RECOMMENDATION: "RECOMMENDATION", DECISION: "DECREE", KNOWLEDGE: "SYMPOSIUM", PREDICTION: "FORECAST", PERSONAL: "GAZE", COMPARISON: "COMPARISON" },
    disclaimer: "This revelation is an algorithmic construct of chance. Final agency remains with the seeker.",
    frameworks: { DEFAULT: "Synthesized Core", PSYCHOANALYSIS: "Psychoanalysis", GESTALT: "Gestalt", RUSSIAN: "Russian Philosophy", GERMAN: "German Philosophy", EXISTENTIAL: "Existentialism", THEOLOGICAL: "Theology", BUDDHIST: "Zen Buddhism", POST_MODERN: "Post-Modernism", ANCIENT_GREEKS: "Ancient Greeks", ANCIENT_ROMANS: "Ancient Romans" }
  },
  RU: {
    ask: "СПРОСИТЬ", randomRequest: "СЛУЧАЙНЫЙ ЗАПРОС", logic: "Логика", chaos: "Хаос", voidEmpty: "Пустота безмолвна", return: "Назад", winner: "ПОБЕДИТЕЛЬ", essence: "СУЩНОСТЬ", mantra: "МАНТРА", decree: "УКАЗ", forecast: "ПРОГНОЗ", gist: "СУТЬ", prediction: "ПРЕДСКАЗАНИЕ", decision: "ВЫБОР", recommendation: "РЕКОМЕНДАЦИЯ", readPerspectives: "ПОЛНЫЙ СИМПОЗИУМ", closeVerdict: "ЗАКРЫТЬ", saveArtifact: "АРТЕФАКТ", saveCard: "Сохранить Карту", saveImage: "Сохранить Фото", newQuery: "НОВЫЙ ЗАПРОС", sources: "База доказательств", studyFurther: "ИЗУЧИТЬ ПОДРОБНЕЕ", imageLost: "Видение потеряно.", title: "Оракул\nСлучая", footer: "Анти-Алгоритм v1.5", errorMsg: "Произошел парадокс.", history: "ИСТОРИЯ", optionA: "Вариант А", optionB: "Вариант Б", translating: "Перевод...",
    manualCalibration: "Калибровка",
    cancelManual: "Отмена",
    backupWarning: "АКТИВИРОВАН РЕЗЕРВНЫЙ РЕЖИМ",
    dailyContemplation: "Ежедневное размышление",
    studyEvidence: "ИЗУЧИТЬ УЛИКИ",
    askAgain: "БРОСИТЬ КУБИКИ СНОВА",
    loadingAnalysis: "Синтез откровения Совета...",
    councilTally: "Голоса Совета",
    councilConsensus: "Консенсус Совета",
    existentialResonance: "Экзистенциальный резонанс",
    probabilityOccurrence: "Вероятность События",
    councilResolve: "Решимость Совета",
    ontologicalCore: "Синтезированное Откровение",
    uncertaintyPrefix: "Спорный запрос",
    councilOfPhilosophers: "Совет Философов",
    learningStyle: "Стиль обучения",
    profileActive: "Профиль активен",
    cancelProfile: "Сбросить профиль",
    startTest: "Начать калибровку",
    saveProfile: "Зафиксировать паттерн",
    modes: { RECOMMENDATION: "РЕКОМЕНДАЦИЯ", DECISION: "УКАЗ", KNOWLEDGE: "СИМПОЗИУМ", PREDICTION: "ПРЕДСКАЗАНИЕ", PERSONAL: "ВЗГЛЯД", COMPARISON: "СРАВНЕНИЕ" },
    disclaimer: "Этот совет — алгоритмический продукт случая. Ответственность лежит на ищущем.",
    frameworks: { DEFAULT: "Ядро", PSYCHOANALYSIS: "Психоанализ", GESTALT: "Гештальт", RUSSIAN: "Русская философия", GERMAN: "Немецкая философия", EXISTENTIAL: "Экзистенциализм", THEOLOGICAL: "Теология", BUDDHIST: "Дзен", POST_MODERN: "Постмодернизм", ANCIENT_GREEKS: "Древние греки", ANCIENT_ROMANS: "Древние римляне" }
  }
};

interface ProfilingQuestion {
  id: string;
  axis: 'EI' | 'SN' | 'TF' | 'JP';
  q: string;
  a1: string; // Map to left side (E/S/T/J)
  a2: string; // Map to right side (I/N/F/P)
}

const QUESTION_POOL: ProfilingQuestion[] = [
  // EI Pool
  { id: 'ei1', axis: 'EI', q: "At a symposium, do you find energy in the crowd or in the shadows?", a1: "The Crowd (Extraversion)", a2: "The Shadows (Introversion)" },
  { id: 'ei2', axis: 'EI', q: "When struck by a new thought, do you seek a listener or a locked room?", a1: "A Listener (Extraversion)", a2: "A Locked Room (Introversion)" },
  { id: 'ei3', axis: 'EI', q: "Do you prefer a broad network of acquaintances or a small circle of deep bonds?", a1: "Broad Network (Extraversion)", a2: "Deep Bonds (Introversion)" },
  { id: 'ei4', axis: 'EI', q: "In a public square, do you walk the center path or stick to the edges?", a1: "The Center (Extraversion)", a2: "The Edges (Introversion)" },
  { id: 'ei5', axis: 'EI', q: "Do you process your dilemmas by speaking them aloud or by silent internal debate?", a1: "Speaking Aloud (Extraversion)", a2: "Silent Debate (Introversion)" },
  // SN Pool
  { id: 'sn1', axis: 'SN', q: "When observing a painting, do you see the brushstrokes or the hidden story?", a1: "The Brushstrokes (Sensing)", a2: "The Hidden Story (Intuition)" },
  { id: 'sn2', axis: 'SN', q: "To build a machine, do you trust the schematic or the divine spark?", a1: "The Schematic (Sensing)", a2: "The Divine Spark (Intuition)" },
  { id: 'sn3', axis: 'SN', q: "When exploring a new city, do you look at the architecture or feel the 'spirit' of the streets?", a1: "The Architecture (Sensing)", a2: "The Spirit (Intuition)" },
  { id: 'sn4', axis: 'SN', q: "Do you focus on the facts of today or the possibilities of tomorrow?", a1: "Facts of Today (Sensing)", a2: "Possibilities (Intuition)" },
  { id: 'sn5', axis: 'SN', q: "When following a recipe, do you measure exactly or improvise based on a 'hunch'?", a1: "Measure Exactly (Sensing)", a2: "Improvise (Intuition)" },
  // TF Pool
  { id: 'tf1', axis: 'TF', q: "In a crisis of logic, do you trust the cold equation or the warm pulse?", a1: "The Cold Equation (Thinking)", a2: "The Warm Pulse (Feeling)" },
  { id: 'tf2', axis: 'TF', q: "If the truth hurts a friend, do you sharpen the blade or soften the blow?", a1: "Sharpen the Blade (Thinking)", a2: "Soften the Blow (Feeling)" },
  { id: 'tf3', axis: 'TF', q: "Do you value Justice over Mercy, or Mercy over Justice?", a1: "Justice (Thinking)", a2: "Mercy (Feeling)" },
  { id: 'tf4', axis: 'TF', q: "Should society be governed by objective laws or subjective needs?", a1: "Objective Laws (Thinking)", a2: "Subjective Needs (Feeling)" },
  { id: 'tf5', axis: 'TF', q: "When criticizing a flawed design, do you focus on the technical error or the impact on the user's mood?", a1: "Technical Error (Thinking)", a2: "Emotional Impact (Feeling)" },
  // JP Pool
  { id: 'jp1', axis: 'JP', q: "Do you prefer a map with a fixed path or a compass for a wild trail?", a1: "Fixed Path (Judging)", a2: "Wild Trail (Perceiving)" },
  { id: 'jp2', axis: 'JP', q: "Is a finished task a closure of a chapter or a cage for the spirit?", a1: "Closure (Judging)", a2: "A Cage (Perceiving)" },
  { id: 'jp3', axis: 'JP', q: "When invited to a feast, do you prefer a scheduled menu or a spontaneous potluck?", a1: "Scheduled (Judging)", a2: "Spontaneous (Perceiving)" },
  { id: 'jp4', axis: 'JP', q: "Is your workspace a structured grid or a landscape of creative chaos?", a1: "Structured Grid (Judging)", a2: "Creative Chaos (Perceiving)" },
  { id: 'jp5', axis: 'JP', q: "Do you find peace in a completed list or thrill in an unplanned afternoon?", a1: "Completed List (Judging)", a2: "Unplanned Thrill (Perceiving)" },
];

const MBTI_MAP: Record<string, { label: string }> = {
  "ISTJ": { label: "The Inspector" }, "ISFJ": { label: "The Protector" }, "INFJ": { label: "The Advocate" }, "INTJ": { label: "The Architect" },
  "ISTP": { label: "The Crafter" }, "ISFP": { label: "The Artist" }, "INFP": { label: "The Mediator" }, "INTP": { label: "The Thinker" },
  "ESTP": { label: "The Persuader" }, "ESFP": { label: "The Performer" }, "ENFP": { label: "The Champion" }, "ENTP": { label: "The Debater" },
  "ESTJ": { label: "The Director" }, "ESFJ": { label: "The Caregiver" }, "ENFJ": { label: "The Protagonist" }, "ENTJ": { label: "The Commander" }
};

const Icons = {
  ArrowLeft: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  History: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  Speaker: ({ muted, loading }: { muted: boolean, loading: boolean }) => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className={loading ? 'animate-pulse' : ''}>
      {muted ? <><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></> : <><path d="M11 5l-5 4H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>}
    </svg>
  ),
  Close: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>,
  Settings: () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1"/></svg>,
  Download: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
  Sparkle: () => <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  External: () => <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>,
  Refresh: () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  Search: () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Mind: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z"/><path d="M8 9.5h8M8 12h8M8 14.5h5"/></svg>
};

const renderHyperlinkedText = (input: string | undefined, isRenoir: boolean, isVerdict: boolean = false) => {
  if (!input) return null;
  const str = typeof input === 'string' ? input : '';
  const parts = str.split(/(\[\[.*?\]\]|\(\(.*?\)\))/g);
  return parts.map((part, i) => {
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const title = part.slice(2, -2);
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(title)}`;
      return (
        <a 
          key={i} 
          href={searchUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`underline decoration-1 underline-offset-2 opacity-80 hover:opacity-100 transition-opacity ${isRenoir ? 'text-amber-400' : 'text-red-700'}`}
        >
          {`"${title}"`}
        </a>
      );
    }
    if (part.startsWith('((') && part.endsWith('))')) {
      const term = part.slice(2, -2).toLowerCase();
      if (isVerdict) return term; 
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(term)}`;
      return (
        <a 
          key={i} 
          href={searchUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`underline decoration-1 underline-offset-2 opacity-80 hover:opacity-100 transition-opacity ${isRenoir ? 'text-amber-400' : 'text-red-700'}`}
        >
          {term}
        </a>
      );
    }
    return part;
  });
};

const TextBlock: React.FC<{ text?: any; light?: boolean; dropCap?: boolean; isRenoir?: boolean; isLoading?: boolean; loadingLabel?: string; forExport?: boolean }> = ({ text, light, dropCap, isRenoir, isLoading, loadingLabel, forExport }) => {
  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-4 opacity-50">
        <div className={`w-12 h-1 text-center animate-bounce ${isRenoir ? 'bg-amber-500' : 'bg-red-600'}`} />
        <p className="text-[10px] font-black uppercase tracking-widest">{loadingLabel}</p>
      </div>
    );
  }
  if (!text) return null;
  
  const str = typeof text === 'string' ? text : (text.text || JSON.stringify(text));
  const segments = str.replace(/\\n/g, '\n').split(/\n+/).map((p: string) => p.trim()).filter(Boolean);
  
  if (forExport) {
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <tbody>
          {segments.map((p: string, i: number) => (
            <tr key={i}>
              <td style={{ paddingBottom: '40px', verticalAlign: 'top' }}>
                <p className={`w-full text-lg leading-relaxed text-justify font-light ${isRenoir ? 'text-amber-100' : 'text-black'}`} style={{ margin: 0, hyphens: 'auto', textAlignLast: 'left' }}>
                  {dropCap && i === 0 && p.length > 0 ? (
                    <>
                      <span className={`float-left text-9xl font-black mr-4 mb-2 mt-[-16px] leading-none ${isRenoir ? 'font-serif text-amber-500' : 'font-sans text-red-600'}`}>
                        {p.charAt(0)}
                      </span>
                      {renderHyperlinkedText(p.substring(1), !!isRenoir)}
                    </>
                  ) : (
                    renderHyperlinkedText(p, !!isRenoir)
                  )}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className={`w-full space-y-8 animate-in fade-in duration-700`}>
      {segments.map((p: string, i: number) => {
        if (dropCap && p.length > 0) {
          const firstChar = p.charAt(0);
          const rest = p.substring(1);
          return (
            <p key={i} className={`w-full text-base md:text-lg leading-relaxed text-justify font-light ${light ? 'text-white opacity-90' : 'opacity-90'} break-inside-avoid-column`} style={{ hyphens: 'auto', textAlignLast: 'left' }}>
              <span className={`float-left text-8xl md:text-9xl font-black mr-4 mb-2 ${forExport ? 'mt-[-16px] leading-none' : 'mt-2 leading-[0.7]'} ${isRenoir ? 'font-serif text-amber-500' : 'font-sans text-red-600'}`}>
                {firstChar}
              </span>
              {renderHyperlinkedText(rest, !!isRenoir)}
            </p>
          );
        }
        return (
          <p key={i} className={`w-full text-base md:text-lg leading-relaxed text-justify font-light ${light ? 'text-white opacity-90' : 'opacity-90'} break-inside-avoid-column`} style={{ hyphens: 'auto', textAlignLast: 'left' }}>
            {renderHyperlinkedText(p, !!isRenoir)}
          </p>
        );
      })}
    </div>
  );
};

export const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('SUPREMATIST');
  const [uiLanguage, setUiLanguage] = useState<Language>('EN');
  const [state, setState] = useState<OracleState>({ status: 'IDLE', query: '', response: null, logicScore: 50, chaosScore: 50, attempts: 0 });
  const [activeFramework, setActiveFramework] = useState<FrameworkType>('DEFAULT');
  const [loadingFrameworks, setLoadingFrameworks] = useState<Set<string>>(new Set());
  const [isMuted, setIsMuted] = useState(true);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showPerspectivesModal, setShowPerspectivesModal] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageHasError, setImageHasError] = useState(false);
  const [isVisionActuallyReady, setIsVisionActuallyReady] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [imgCrossOrigin, setImgCrossOrigin] = useState<"anonymous" | undefined>("anonymous");
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [learningProfile, setLearningProfile] = useState<LearningProfile | null>(null);
  
  // Profiling State
  const [showProfilingModal, setShowProfilingModal] = useState(false);
  const [profilingStep, setProfilingStep] = useState(0);
  const [profilingAnswers, setProfilingAnswers] = useState<Record<string, number>>({});
  const [activeQuestions, setActiveQuestions] = useState<ProfilingQuestion[]>([]);
  
  const [ghostIndex, setGhostIndex] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [inputValue, setInputValue] = useState("");
  
  const [curiosities, setCuriosities] = useState<any[]>([]);
  const [curiosityOffset, setCuriosityOffset] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const resultImageRef = useRef<HTMLImageElement>(null);
  const analysisHeaderRef = useRef<HTMLSpanElement>(null);
  const imageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isImageActuallyLoadingRef = useRef(false);
  
  const isRenoir = theme === 'IMPRESSIONIST';
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.EN;
  const suggestions = SUGGESTIONS_POOLS[uiLanguage];

  // Logic Handlers
  const stopAudio = () => {
    stopSpeaking();
    setIsMuted(true);
    setIsTtsLoading(false);
  };

  const handleSpeakerToggle = async () => {
    if (!isMuted || isTtsLoading) {
      stopAudio();
      return;
    }
    
    if (state.response) {
      setIsTtsLoading(true);
      setIsMuted(false);
      try {
        const textToSpeak = activeAnalysisData?.analysis || activeAnalysisData?.verdict || "";
        const result = await speakText(textToSpeak, uiLanguage);
        if (result) {
          result.source.onstart = () => setIsTtsLoading(false);
          result.source.onend = () => { setIsMuted(true); setIsTtsLoading(false); };
          result.source.onerror = () => { setIsMuted(true); setIsTtsLoading(false); };
        } else {
          setIsMuted(true);
          setIsTtsLoading(false);
        }
      } catch (e) {
        console.error("Speaker failure", e);
        setIsMuted(true);
        setIsTtsLoading(false);
      }
    }
  };

  const scrollToAnalysis = () => {
    analysisHeaderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFetchPerspective = async (fType: FrameworkType) => {
    if (!state.response || fType === 'DEFAULT') return;
    const key = frameworkKeyMap[fType];
    const p = (state.response.perspectives as any)?.[key];
    if (!p || p.analysis) return;

    setLoadingFrameworks(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    try {
      const analysis = await fetchPerspectiveAnalysis(
        key,
        p.philosopherName,
        state.query,
        p.verdict,
        p.philosopherThemes || [],
        uiLanguage,
        state.chaosScore,
        !!state.response.isFallback
      );

      setState(prev => {
        if (!prev.response) return prev;
        const newPerspectives = { ...prev.response.perspectives };
        (newPerspectives as any)[key] = { ...p, analysis };
        return { ...prev, response: { ...prev.response, perspectives: newPerspectives } };
      });
    } catch (e) {
      console.error("Analysis fetch failed", e);
    } finally {
      setLoadingFrameworks(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const loadAllPerspectives = () => {
    setShowPerspectivesModal(true);
    perspectivesList.forEach(p => {
       handleFetchPerspective(p.frameworkType);
    });
  };

  const NavButton = ({ onClick, children, className = "" }: any) => (
    <button onClick={onClick} className={`w-11 h-11 rounded-full border flex items-center justify-center backdrop-blur-xl transition-all shadow-xl active:scale-95 ${isRenoir ? 'bg-amber-950/40 border-amber-900/20 text-amber-100' : 'bg-white/40 border-black/5 text-black'} ${className}`}>{children}</button>
  );

  const GlobalUI = (
    <>
      <div className="fixed top-6 left-4 z-[500] flex gap-3">
        {state.status !== 'IDLE' && <NavButton onClick={() => { stopAudio(); setState(s => ({ ...s, status: 'IDLE' })); }}><Icons.ArrowLeft /></NavButton>}
        <NavButton onClick={handleSpeakerToggle} className={(!isMuted || isTtsLoading) ? 'ring-1 ring-red-500' : 'opacity-40'}><Icons.Speaker muted={isMuted} loading={isTtsLoading}/></NavButton>
      </div>
      <div className="fixed top-6 right-4 z-[500] flex gap-3 items-center">
        <div className={`flex p-1 rounded-full border backdrop-blur-xl ${isRenoir ? 'bg-amber-950/40 border-amber-900/20' : 'bg-white/40 border-black/5'}`}>
          <button onClick={() => setUiLanguage(l => l === 'EN' ? 'RU' : 'EN')} className="w-8 h-8 rounded-full text-[9px] font-black">{uiLanguage}</button>
          <button onClick={() => setTheme(t => t === 'SUPREMATIST' ? 'IMPRESSIONIST' : 'SUPREMATIST')} className={`px-3 h-8 rounded-full text-[9px] font-black ${isRenoir ? 'bg-amber-700 text-white' : 'bg-black text-white'}`}>
            {theme === 'SUPREMATIST' ? 'Mode A' : 'Mode B'}
          </button>
        </div>
        <NavButton onClick={() => setShowHistory(true)}><Icons.History /></NavButton>
      </div>
    </>
  );

  const HistorySidebar = (
    <div className={`fixed inset-0 z-[1000] flex justify-end transition-all ${showHistory ? 'visible opacity-100' : 'invisible opacity-0'}`}>
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${showHistory ? 'opacity-100' : 'opacity-0'}`} onClick={() => setShowHistory(false)} />
      <div className={`relative z-[1010] w-full max-sm:max-w-full max-w-sm h-full p-6 md:p-12 shadow-2xl overflow-y-auto flex flex-col transition-transform duration-500 transform ${showHistory ? 'translate-x-0' : 'translate-x-full'} ${isRenoir ? 'bg-[#1e0a0a] text-amber-100 border-l border-amber-900/10' : 'bg-white text-black border-l border-black/5'}`}>
         <div className="flex justify-between items-center mb-10">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter">{t.history}</h2>
            <button onClick={() => setShowHistory(false)} className="p-2 hover:rotate-90 transition-transform bg-current/5 rounded-full"><Icons.Close /></button>
         </div>
         <div className="space-y-6 flex-1">
            {history.length === 0 ? (
              <div className="text-center py-24 opacity-20 text-[10px] font-black uppercase tracking-widest">{t.voidEmpty}</div>
            ) : history.map(item => (
              <button key={item.id} onClick={() => { stopAudio(); setState({ ...state, status: 'REVEALED', response: item.response, query: item.query, logicScore: item.logicScore, chaosScore: item.chaosScore }); setShowHistory(false); setIsVisionActuallyReady(false); }} className="block w-full text-left p-6 border border-current/10 rounded-3xl hover:bg-current/5 hover:border-current/20 transition-all group active:scale-95 shadow-sm">
                <div className="text-[9px] opacity-40 mb-2 font-black tracking-widest uppercase flex justify-between items-center">
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
                <div className="text-base font-bold uppercase truncate">{item.query}</div>
              </button>
            ))}
         </div>
      </div>
    </div>
  );

  useEffect(() => {
    const pool = ORACLE_CURIOSITIES[uiLanguage];
    const picked = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
    setCuriosities(picked);
  }, [uiLanguage]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCuriosityOffset(prev => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('oracle_history');
    if (saved) try { setHistory(JSON.parse(saved)); } catch (e) {}

    const savedProfile = localStorage.getItem('oracle_learning_profile');
    if (savedProfile) try { setLearningProfile(JSON.parse(savedProfile)); } catch (e) {}
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      try {
        const pruned = history.slice(0, 15).map(item => ({
          ...item,
          response: { ...item.response, base64Image: undefined, }
        }));
        localStorage.setItem('oracle_history', JSON.stringify(pruned));
      } catch (e) {
        const tinyPruned = history.slice(0, 5).map(item => ({
          ...item,
          response: { ...item.response, base64Image: undefined }
        }));
        try { localStorage.setItem('oracle_history', JSON.stringify(tinyPruned)); } catch (inner) {}
      }
    }
  }, [history]);

  useEffect(() => {
    if (state.status === 'REVEALED' && state.response?.imageUrl && isImageLoading) {
      if (imageTimeoutRef.current) clearTimeout(imageTimeoutRef.current);
      
      if (!state.response.isFallback) {
        isImageActuallyLoadingRef.current = true;
        imageTimeoutRef.current = setTimeout(() => {
          if (isImageActuallyLoadingRef.current) {
            console.log("[Oracle] Pollinations slow, falling back to CogView...");
            handleImageRegen(true);
          }
        }, 7500); // 7.5 seconds timeout for Pollinations
      }
    }
    return () => {
      if (imageTimeoutRef.current) clearTimeout(imageTimeoutRef.current);
    };
  }, [state.response?.imageUrl, state.status]);

  useEffect(() => { 
    if (state.status === 'REVEALED' && state.response) { 
      setImageHasError(false);
      handleImageRegen(); 
    } 
  }, [theme]);
  
  useEffect(() => { 
    if (state.status === 'REVEALED' && state.response && state.response.language !== uiLanguage) {
      handleContentTranslation(); 
    }
  }, [uiLanguage]);

  useEffect(() => {
    if (activeFramework !== 'DEFAULT' && state.status === 'REVEALED') {
      handleFetchPerspective(activeFramework);
    }
  }, [activeFramework]);

  const runQuery = async (queryText: string, isDaily = false, overrideChaos?: number) => {
    if (!queryText) return;
    const finalChaos = overrideChaos !== undefined ? overrideChaos : (isManual ? state.chaosScore : Math.floor(Math.random() * 80) + 10);
    const finalLogic = 100 - finalChaos;
    
    setIsVisionActuallyReady(false);
    setIsImageLoading(true);
    setImageHasError(false);
    
    setState(s => ({ ...s, status: 'THINKING', query: queryText, chaosScore: finalChaos, logicScore: finalLogic }));
    
    try {
      const response = await consultOracle(queryText, finalChaos, theme, uiLanguage, learningProfile);
      const taggedResponse = { ...response, isDaily };
      
      setState(s => ({ ...s, status: 'REVEALED', response: taggedResponse, chaosScore: finalChaos, logicScore: finalLogic }));
      setHistory(prev => [{ id: Date.now().toString(), query: queryText, response: taggedResponse, timestamp: Date.now(), logicScore: finalLogic, chaosScore: finalChaos }, ...prev].slice(0, 15));
      setActiveFramework('DEFAULT');
      setLoadingFrameworks(new Set());
    } catch (e: any) { 
      const message = e instanceof Error ? e.message : 'Paradox in the void.';
      console.error("[App] Council deliberation failed:", message, e);
      setState(s => ({ ...s, status: 'ERROR', error: message })); 
    }
  };

  const startProfiling = () => {
    // Select exactly 10 questions randomly from the pool, ensuring variety
    const axes: Array<'EI' | 'SN' | 'TF' | 'JP'> = ['EI', 'SN', 'TF', 'JP'];
    const chosen: ProfilingQuestion[] = [];
    
    // Pick 2 guaranteed unique from each axis first (8 questions total)
    axes.forEach(axis => {
      const pool = QUESTION_POOL.filter(q => q.axis === axis).sort(() => 0.5 - Math.random());
      chosen.push(pool[0], pool[1]);
    });
    
    // Pick 2 more unique questions randomly from the remaining pool to reach 10
    const remaining = QUESTION_POOL.filter(q => !chosen.some(c => c.id === q.id)).sort(() => 0.5 - Math.random());
    chosen.push(remaining[0], remaining[1]);
    
    setActiveQuestions(chosen.sort(() => 0.5 - Math.random()));
    setProfilingStep(0);
    setProfilingAnswers({});
    setShowProfilingModal(true);
  };

  const handleProfilingAnswer = (answer: number) => {
    const question = activeQuestions[profilingStep];
    const newAnswers = { ...profilingAnswers, [question.id]: answer };
    setProfilingAnswers(newAnswers);

    if (profilingStep < activeQuestions.length - 1) {
      setProfilingStep(profilingStep + 1);
    } else {
      // Calculate MBTI based on majority for each axis across the 10 chosen questions
      const getResult = (axis: 'EI' | 'SN' | 'TF' | 'JP', left: string, right: string) => {
        const axisQuestions = activeQuestions.filter(q => q.axis === axis);
        let leftCount = 0;
        let rightCount = 0;
        axisQuestions.forEach(q => {
          if (newAnswers[q.id] === 0) leftCount++;
          else rightCount++;
        });
        return leftCount >= rightCount ? left : right;
      };

      const type = getResult('EI', 'E', 'I') +
                   getResult('SN', 'S', 'N') +
                   getResult('TF', 'T', 'F') +
                   getResult('JP', 'J', 'P');
      
      const profile: LearningProfile = {
        type,
        label: MBTI_MAP[type]?.label || "The Individual",
        traits: {
          energy: type[0] as 'I' | 'E',
          information: type[1] as 'S' | 'N',
          decision: type[2] as 'T' | 'F',
          lifestyle: type[3] as 'J' | 'P'
        }
      };

      setLearningProfile(profile);
      localStorage.setItem('oracle_learning_profile', JSON.stringify(profile));
      setShowProfilingModal(false);
    }
  };

  const cancelProfile = () => {
    setLearningProfile(null);
    localStorage.removeItem('oracle_learning_profile');
  };

  const ProfilingModal = (
    <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-3xl flex items-center justify-center p-6" onClick={() => setShowProfilingModal(false)}>
      <div className={`w-full max-w-lg p-10 md:p-14 rounded-[50px] border shadow-2xl transition-all duration-500 animate-in zoom-in-95 ${isRenoir ? 'bg-[#1e0a0a] border-amber-900/40 text-amber-100' : 'bg-white border-black/10 text-black'}`} onClick={e => e.stopPropagation()}>
         <div className="flex justify-between items-center mb-12">
            <span className="text-[10px] font-black uppercase tracking-[0.6em] opacity-40">{t.learningStyle}</span>
            <button onClick={() => setShowProfilingModal(false)} className="opacity-40 hover:opacity-100 transition-opacity"><Icons.Close /></button>
         </div>

         <div className="space-y-12">
            <div className="space-y-4">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-black opacity-30">REVELATION {profilingStep + 1} / {activeQuestions.length}</span>
               </div>
               <div className={`w-full h-1 bg-current/10 rounded-full overflow-hidden`}>
                  <div className={`h-full bg-red-600 transition-all duration-500`} style={{ width: `${((profilingStep + 1) / activeQuestions.length) * 100}%` }} />
               </div>
            </div>

            <h3 className="text-xl md:text-2xl font-black uppercase leading-tight tracking-tighter text-center h-24 flex items-center justify-center">
               {activeQuestions[profilingStep]?.q}
            </h3>

            <div className="grid grid-cols-1 gap-4">
               <button 
                  onClick={() => handleProfilingAnswer(0)}
                  className={`py-6 px-8 rounded-3xl border-2 font-bold transition-all text-sm uppercase tracking-widest active:scale-95 text-center ${isRenoir ? 'border-amber-900/40 hover:bg-amber-900' : 'border-black/5 hover:bg-black hover:text-white'}`}
               >
                  {activeQuestions[profilingStep]?.a1}
               </button>
               <button 
                  onClick={() => handleProfilingAnswer(1)}
                  className={`py-6 px-8 rounded-3xl border-2 font-bold transition-all text-sm uppercase tracking-widest active:scale-95 text-center ${isRenoir ? 'border-amber-900/40 hover:bg-amber-900' : 'border-black/5 hover:bg-black hover:text-white'}`}
               >
                  {activeQuestions[profilingStep]?.a2}
               </button>
            </div>
         </div>
      </div>
    </div>
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (/[а-яА-ЯЁё]/.test(val) && uiLanguage !== 'RU') setUiLanguage('RU');
    else if (/[a-zA-Z]/.test(val) && uiLanguage !== 'EN') setUiLanguage('EN');
  };

  const handleContentTranslation = async () => {
    if (!state.response) return;
    setIsTranslating(true);
    try {
      const translated = await translateOracleResponse(state.response, uiLanguage);
      setState(prev => ({ ...prev, response: translated }));
    } catch (e) {} finally { setIsTranslating(false); }
  };

  const handleImageRegen = async (force = false) => {
    if (!state.response) return;
    setIsVisionActuallyReady(false);
    setIsImageLoading(true);
    setImageHasError(false);
    isImageActuallyLoadingRef.current = true;
    
    if (imageTimeoutRef.current) clearTimeout(imageTimeoutRef.current);
    
    try {
      const result = await regenerateOracleImage(
        state.response, 
        theme, 
        state.chaosScore, 
        state.query, 
        force
      );
      setState(prev => ({
        ...prev,
        attempts: (prev.attempts || 0) + 1,
        response: prev.response ? { 
          ...prev.response, 
          imageStyleLabel: result.label, 
          imageUrl: result.url, 
          isFallback: result.isFallback || prev.response.isFallback,
          imageError: undefined
        } : null
      }));
    } catch (e: any) { 
      console.error("[Oracle] Image regeneration failed:", e);
      setImageHasError(true);
      isImageActuallyLoadingRef.current = false;
      setState(prev => ({
        ...prev,
        response: prev.response ? { ...prev.response, imageError: e.message } : null
      }));
    } finally { 
      // We don't set isImageLoading to false here if we are waiting for the <img> onLoad
    }
  };

  const handleRandomRequest = () => {
    const randomIdx = Math.floor(Math.random() * suggestions.length);
    const query = suggestions[randomIdx];
    if (inputRef.current) inputRef.current.value = query;
    setInputValue(query);
    runQuery(query);
  };

  const [localDisplayUrl, setLocalDisplayUrl] = useState<string | null>(null);

  const getCORSFriendlyImage = async (url: string): Promise<string> => {
    if (!url) return "";
    
    // Only proxy external URLs that are likely to have CORS issues
    if (url.includes('ufileos.com') || url.includes('bigmodel.cn') || url.includes('pollinations.ai')) {
      try {
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`Proxy fetch failed (${response.status})`);
        const blob = await response.blob();
        
        // Basic check for valid image blob
        if (blob.size < 100) {
          console.warn("[Oracle] Suspiciously small blob from proxy, might be an error message", blob.size);
        }
        
        return URL.createObjectURL(blob);
      } catch (e: any) {
        console.warn("[Oracle] Proxy fallback failed, returning direct URL", e.message);
        return url;
      }
    }
    return url;
  }

  useEffect(() => {
    let active = true;
    let currentBlobUrl: string | null = null;

    const updateLocalUrl = async () => {
      const imageUrl = state.response?.imageUrl;
      if (imageUrl) {
        console.log("[Oracle] Image URL changed, starting load process:", imageUrl);
        setImageHasError(false);
        setIsImageLoading(true);
        setIsVisionActuallyReady(false);
        setImgCrossOrigin("anonymous");
        
        try {
          const url = await getCORSFriendlyImage(imageUrl);
          if (active) {
            console.log("[Oracle] Successfully generated local URL:", url);
            currentBlobUrl = url;
            setLocalDisplayUrl(url);
          }
        } catch (e: any) {
          console.warn("[Oracle] Failed to fetch local image URL, will use direct URL:", e);
          // We don't set imageHasError here because we can still use the direct URL
        }
      } else {
        if (active) {
          setLocalDisplayUrl(null);
        }
      }
    };

    updateLocalUrl();

    return () => { 
      active = false; 
      if (currentBlobUrl && currentBlobUrl.startsWith('blob:')) {
        console.log("[Oracle] Cleaning up blob URL:", currentBlobUrl);
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [state.response?.imageUrl, state.attempts]);

  const saveArtifactAsImage = async () => {
    if (!captureRef.current || !state.response?.imageUrl) return;
    
    const originalSrc = state.response.imageUrl;
    let localUrl: string | null = null;
    
    try {
      // Use CORS-friendly image to avoid tainting the canvas
      localUrl = await getCORSFriendlyImage(originalSrc);
      if (resultImageRef.current) {
        resultImageRef.current.src = localUrl;
        await new Promise(resolve => {
          if (resultImageRef.current?.complete) resolve(true);
          else {
            resultImageRef.current!.onload = () => resolve(true);
            resultImageRef.current!.onerror = () => resolve(false);
          }
        });
        if (resultImageRef.current?.decode) {
          try { await resultImageRef.current.decode(); } catch (e) {}
        }
      }

      const canvas = await html2canvas(captureRef.current, { 
        backgroundColor: isRenoir ? '#0f0505' : '#ffffff', 
        useCORS: true, 
        scale: 2,
        logging: false,
        allowTaint: false,
        scrollX: 0,
        scrollY: -window.scrollY, // Fix for scrolled content
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
      });

      const link = document.createElement('a');
      link.download = `oracle-decree-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setShowSaveMenu(false);
    } catch (e) { 
      console.error("Export failure", e); 
    } finally {
      if (resultImageRef.current) resultImageRef.current.src = originalSrc;
      if (localUrl && localUrl.startsWith('blob:')) URL.revokeObjectURL(localUrl);
    }
  };

  const savePictureOnly = async () => {
    if (!state.response?.imageUrl) return;
    const link = document.createElement('a');
    link.download = `oracle-vision-${Date.now()}.png`;
    link.href = state.response.imageUrl;
    link.click();
    setShowSaveMenu(false);
  };

  const activeAnalysisData = (() => {
    const r = state.response;
    if (!r) return null;
    if (activeFramework === 'DEFAULT') return { 
      verdict: r.verdict, verdictUrl: r.verdictUrl, analysis: r.detailedAnalysis, tally: r.tally, label: r.imageStyleLabel, sources: r.sources, studyMoreUrl: r.studyMoreUrl, studyMoreLabel: r.studyMoreLabel
    };
    const key = frameworkKeyMap[activeFramework];
    const framework = (r.perspectives as any)?.[key];
    return { 
      verdict: framework?.verdict || r.verdict, verdictUrl: r.verdictUrl, analysis: framework?.analysis, tally: r.tally, label: r.imageStyleLabel, sources: r.sources, studyMoreUrl: r.studyMoreUrl, studyMoreLabel: r.studyMoreLabel, isLoading: loadingFrameworks.has(key) 
    };
  })();

  const VisionLoadingIcon = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none transition-opacity duration-300 bg-current/5 backdrop-blur-sm">
       {isRenoir ? (
         <div className="flex flex-col items-center">
            <div className="w-14 h-14 border-4 border-amber-500 rounded-full animate-pulse bg-transparent mb-6 shadow-[0_0_30px_rgba(245,158,11,0.4)]" />
            <span className="text-[11px] font-black uppercase tracking-[0.6em] text-amber-500 drop-shadow-md">Visualizing...</span>
         </div>
       ) : (
         <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-2 border-red-600 animate-oracle-spin-pulse mb-6" />
            <span className="text-[10px] font-black uppercase tracking-[0.8em] text-red-600/60 animate-pulse">Visualizing...</span>
         </div>
       )}
    </div>
  );

  if (state.status === 'ERROR') return (
    <div className={`h-screen flex flex-col items-center justify-center p-8 text-center ${isRenoir ? 'bg-[#0f0505] text-amber-100 font-serif' : 'bg-white text-black font-sans'}`}>
       <h1 className="text-2xl font-black uppercase mb-4 tracking-tighter">Paradox Encountered</h1>
       <p className="text-xs opacity-60 mb-8 max-w-xs mx-auto">{state.error || "The void is currently unreadable."}</p>
       <button onClick={() => setState(s => ({ ...s, status: 'IDLE' }))} className="px-8 py-3 border-current font-black uppercase text-[10px] rounded-full">Recalibrate</button>
    </div>
  );

  if (state.status === 'THINKING') return <LoadingScreen theme={theme} language={uiLanguage} />;

  if (state.status === 'REVEALED' && state.response) {
    const r = state.response;
    const modeLabel = (t.modes as any)[r.type] || t.modes.KNOWLEDGE;
    const genre = theme === 'SUPREMATIST' ? 'SUPREMATISM' : 'IMPRESSIONISM';
    const displayLabel = `${genre} — ${modeLabel}`;
    
    let verdictTypeLabel = t.decree;
    if (r.type === 'COMPARISON') verdictTypeLabel = t.winner;
    else if (r.type === 'KNOWLEDGE') verdictTypeLabel = t.essence;
    else if (r.type === 'PERSONAL') verdictTypeLabel = t.mantra;
    else if (r.type === 'PREDICTION') verdictTypeLabel = t.forecast;
    else if (r.type === 'DECISION') verdictTypeLabel = t.decree;
    else if (r.type === 'RECOMMENDATION') verdictTypeLabel = t.recommendation;

    let tallyLabel = t.councilTally;
    if (r.type === 'KNOWLEDGE') tallyLabel = t.councilConsensus;
    else if (r.type === 'PERSONAL') tallyLabel = t.existentialResonance;
    else if (r.type === 'PREDICTION') tallyLabel = t.probabilityOccurrence;
    else if (r.type === 'DECISION') tallyLabel = t.councilResolve;

    return (
      <div className={`min-h-screen pt-24 pb-24 px-6 md:px-8 overflow-y-auto ${isRenoir ? 'bg-[#0f0505] text-amber-100 font-serif' : 'bg-white text-black font-sans'}`}>
        
        <div className={`fixed top-0 left-0 right-0 z-[1000] border-t-[1px] flex flex-col items-center py-0.5 bg-current/[0.05] backdrop-blur-md ${isRenoir ? 'border-amber-600' : 'border-red-600'}`}>
          <div className={`text-[4px] md:text-[5px] font-black uppercase tracking-[0.2em] leading-none ${isRenoir ? 'text-amber-500/60' : 'text-red-600/60'}`}>
            {t.backupWarning} | {r.textModelUsed} | {r.imageStyleLabel} | CHAOS: {state.chaosScore}% | NEURAL: SYNCED
          </div>
        </div>

        {GlobalUI}
        {HistorySidebar}

        <div ref={captureRef} className="max-w-3xl mx-auto flex flex-col items-center space-y-12">
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-[0.8] text-center">
            {(r?.title || "The Decree")?.replace(/\[\[|\]\]/g, '')}
          </h1>

          <div className="w-full max-w-[400px]">
            <RatioIndicator logicScore={state.logicScore} chaosScore={state.chaosScore} category={r.category as any} theme={theme} language={uiLanguage} />
            <div className={`relative group cursor-crosshair transition-all duration-700 ${isRenoir ? 'renoir-glow' : 'oracle-glow'}`}>
              <div className={`w-full aspect-square border overflow-hidden relative ${isRenoir ? 'border-amber-900/20 rounded-[60px]' : 'border-black/5'}`}>
                {(isImageLoading || !isVisionActuallyReady) && <VisionLoadingIcon />}
                
                {/* Vision Image */}
                {r.imageUrl ? (
                  <img 
                    ref={resultImageRef}
                    key={(localDisplayUrl || r.imageUrl) + (imgCrossOrigin || 'none')}
                    src={localDisplayUrl || r.imageUrl} 
                    crossOrigin={imgCrossOrigin}
                    onLoad={() => { 
                      console.log("[Oracle] Image loaded successfully:", localDisplayUrl || r.imageUrl);
                      setIsVisionActuallyReady(true); 
                      setIsImageLoading(false); 
                      setImageHasError(false);
                      isImageActuallyLoadingRef.current = false;
                      if (imageTimeoutRef.current) clearTimeout(imageTimeoutRef.current);
                    }}
                    onError={(e) => { 
                      console.error("[Oracle] Image failed to load in img tag:", localDisplayUrl || r.imageUrl);
                      if (imgCrossOrigin === "anonymous") {
                        console.warn("[Oracle] Retrying without crossOrigin...");
                        setImgCrossOrigin(undefined);
                      } else {
                        setImageHasError(true); 
                        setIsVisionActuallyReady(true); 
                        setIsImageLoading(false); 
                        isImageActuallyLoadingRef.current = false;
                        if (imageTimeoutRef.current) clearTimeout(imageTimeoutRef.current);
                        setState(prev => ({
                          ...prev,
                          response: prev.response ? { ...prev.response, imageError: "Vision Synchronization Failed: CORS or Network Error." } : null
                        }));
                      }
                    }}
                    className={`w-full h-full object-cover saturate-[0.15] group-hover:saturate-100 transition-all duration-[1000ms] ease-in-out ${(isImageLoading || !isVisionActuallyReady) ? 'opacity-0 scale-95 blur-xl' : 'opacity-100 scale-100 blur-0'}`} 
                    alt="" 
                  />
                ) : null}

                {(!r.imageUrl || (imageHasError && !isImageLoading)) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-6 z-10 bg-current/[0.02] backdrop-blur-[2px]">
                    <div className="opacity-30 text-[10px] uppercase font-black tracking-widest">{t.imageLost}</div>
                    {imageHasError && (
                      <div className="flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="text-[12px] md:text-[14px] uppercase font-mono font-bold text-red-500 max-w-[300px] break-words bg-red-500/10 p-4 rounded-lg border border-red-500/30 shadow-lg shadow-red-500/5">
                          {r.imageError || "Vision Synchronization Failed: CORS or Network Error"}
                        </div>
                        <div className="flex flex-wrap justify-center gap-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleImageRegen(false); }}
                            className="px-8 py-3 bg-current/10 hover:bg-current/20 text-[10px] uppercase font-black tracking-widest transition-all rounded-full hover:scale-105 active:scale-95"
                          >
                            Synchronize Vision
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className={`absolute bottom-0 left-0 right-0 p-4 pt-6 backdrop-blur-2xl border-t transition-all duration-500 flex justify-between items-center group-hover:opacity-100 opacity-90 ${isRenoir ? 'bg-amber-950/80 text-amber-100/40 group-hover:text-amber-400 border-white/10' : 'bg-white/90 text-black/40 group-hover:text-red-600 border-black/5'}`}>
                   <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] truncate max-w-[50%]">{genre}</span>
                   <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] truncate max-w-[50%] text-right">{modeLabel}</span>
                </div>
              </div>

              {r.isDaily && (
                <div className={`absolute -top-4 -right-4 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 border-2 ${isRenoir ? 'bg-amber-100 text-amber-900 border-amber-900' : 'bg-black text-white border-white'}`}>
                  <Icons.Sparkle /> {t.dailyContemplation}
                </div>
              )}
            </div>
          </div>

          <div className="w-full flex flex-col items-center space-y-8">
            <div className={`w-full p-8 md:p-12 relative transition-all duration-500 shadow-2xl border ${isTranslating ? 'blur-md opacity-40' : ''} ${isRenoir ? 'bg-[#1e0a0a]/80 backdrop-blur-xl border-amber-900/20 rounded-[60px]' : 'bg-white/80 backdrop-blur-xl border-black/5 rounded-[60px]'}`}>
               <div className="flex flex-col items-center mb-8 border-b border-current/10 pb-6">
                 <div className="w-full flex justify-between items-center mb-2">
                   <h3 className="text-[11px] font-black uppercase opacity-40 tracking-[0.4em]">
                     {modeLabel}
                   </h3>
                   <select data-html2canvas-ignore value={activeFramework} onChange={(e) => { setActiveFramework(e.target.value as FrameworkType); scrollToAnalysis(); }} className="text-[10px] font-black uppercase bg-transparent outline-none cursor-pointer decoration-red-500 underline-offset-4 hover:underline">
                      {Object.keys(t.frameworks).map(k => <option key={k} value={k} className="text-black">{(t.frameworks as any)[k]}</option>)}
                   </select>
                 </div>
                 
                 {r.isUncertain && (
                   <div className={`text-center py-2 px-4 border rounded-xl animate-bounce mt-4 ${isRenoir ? 'bg-amber-900/10 border-amber-500/30' : 'bg-red-50 border-red-200'}`}>
                     <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isRenoir ? 'text-amber-500' : 'text-red-600'}`}>{t.uncertaintyPrefix}</p>
                     <p className="text-[11px] italic opacity-70">"{r.uncertaintyQuery || 'Was this intended as a personal decision or a recommendation?'}"</p>
                   </div>
                 )}
               </div>

               {r.type === 'COMPARISON' && r.comparison && (
                 <div className="w-full space-y-8 mb-12 animate-in slide-in-from-bottom-4 duration-700">
                   <div className="grid grid-cols-2 gap-4">
                     {['A', 'B'].map(opt => {
                       const title = opt === 'A' ? r.comparison!.optionA : r.comparison!.optionB;
                       const score = opt === 'A' ? r.comparison!.percentageA : r.comparison!.percentageB;
                       const voters = Object.values(r.perspectives || {})
                         .filter(p => (p as Perspective).vote === opt)
                         .map(p => (p as Perspective).philosopherName);
                       
                       return (
                         <div key={opt} className="flex flex-col items-center text-center">
                           <span className={`text-[9px] font-black uppercase opacity-40 mb-2`}>{opt === 'A' ? t.optionA : t.optionB}</span>
                           <span className="text-lg md:text-xl font-black uppercase leading-tight">{title}</span>
                           <div className={`w-full h-2 mt-4 border border-current/10 relative`}>
                             <div className={`absolute top-0 left-0 h-full ${isRenoir ? 'bg-amber-500' : 'bg-red-600'}`} style={{ width: `${score}%` }} />
                           </div>
                           <span className="mt-2 text-[10px] font-black opacity-60">{score}%</span>
                           <div className="mt-4 flex flex-col items-center">
                             <span className="text-[7px] font-black uppercase opacity-30 mb-2 tracking-widest">Delegates</span>
                             <div className="flex flex-wrap justify-center gap-1 opacity-50">
                               {voters.map((vName, vIdx) => (
                                 <span key={vIdx} className="text-[8px] font-black uppercase px-1.5 py-0.5 border border-current/20 rounded-[4px] leading-tight">
                                   {vName}
                                 </span>
                               ))}
                             </div>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>
               )}

               {r.type === 'RECOMMENDATION' && r.recommendationLink && (
                 <div className="w-full flex justify-center mb-8 animate-in slide-in-from-bottom-4 duration-700">
                   <a 
                     href={r.recommendationLink} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className={`flex items-center gap-3 px-8 py-3 rounded-full border-2 font-black uppercase tracking-[0.3em] text-[10px] transition-all hover:scale-105 active:scale-95 shadow-xl ${isRenoir ? 'bg-amber-900 border-amber-500 text-white' : 'bg-black border-red-600 text-white'}`}
                   >
                     <Icons.External /> {t.studyEvidence}
                   </a>
                 </div>
               )}
               
               <div className="flex flex-col items-center justify-center text-center py-6 mb-6 bg-current/[0.03] rounded-3xl border border-current/5 px-8">
                  <span className="text-[9px] font-black uppercase tracking-[0.6em] opacity-30 mb-3">{verdictTypeLabel}</span>
                  <span className={`text-base md:text-lg font-normal tracking-normal leading-relaxed ${isRenoir ? 'text-amber-500' : 'text-red-600'}`}>
                     {renderHyperlinkedText(activeAnalysisData?.verdict || "Decree in progress...", !!isRenoir, true)}
                  </span>
               </div>

               {activeAnalysisData?.tally && (
                  <div className="mb-10 text-center animate-in fade-in slide-in-from-top-2 duration-700">
                    <span className="text-[8px] font-black uppercase tracking-raw block mb-2">{tallyLabel}</span>
                    <span className="text-[10px] md:text-xs font-light italic opacity-60">
                      {activeAnalysisData.tally}
                    </span>
                  </div>
               )}

               {activeAnalysisData && (
                 <div className="w-full animate-in fade-in duration-1000">
                   <div className="mb-8 border-b border-current/5 pb-8">
                     <span ref={analysisHeaderRef} className="text-[9px] font-black uppercase tracking-[0.4em] opacity-30 block mb-6 text-center">{activeFramework === 'DEFAULT' ? t.ontologicalCore : t.frameworks[activeFramework]}</span>
                     <TextBlock text={activeAnalysisData.analysis || "The council is currently formulating the synthesized core of this revelation."} isRenoir={isRenoir} isLoading={activeAnalysisData.isLoading} loadingLabel={t.loadingAnalysis} dropCap={activeFramework === 'DEFAULT'} />
                   </div>

                   <div className="pt-8 mb-8">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.6em] text-center opacity-30 mb-8">{t.councilOfPhilosophers}</h4>
                      <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                        {perspectivesList.map((p) => {
                          const data = (r.perspectives as any)?.[frameworkKeyMap[p.frameworkType]];
                          const isActive = activeFramework === p.frameworkType;
                          const initials = data?.philosopherName?.split(' ').map((n: string) => n[0]).join('') || '?';
                          return (
                            <button
                              key={p.id}
                              onClick={() => { setActiveFramework(p.frameworkType); scrollToAnalysis(); }}
                              className={`group relative flex flex-col items-center transition-all duration-300 ${isActive ? 'scale-110' : 'opacity-40 hover:opacity-100'}`}
                            >
                              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center text-[10px] font-black overflow-hidden transition-all ${isActive ? (isRenoir ? 'border-amber-500 bg-amber-500/20 text-amber-500' : 'border-red-600 bg-red-600/10 text-red-600') : 'border-current/20'}`}>
                                {initials}
                              </div>
                              <span className="mt-2 text-[8px] font-black uppercase tracking-tighter max-w-[60px] text-center leading-[0.8]">{data?.philosopherName}</span>
                            </button>
                          );
                        })}
                      </div>
                   </div>

                   <div className="mb-4">
                     <p className="text-[10px] italic opacity-50 leading-tight max-w-md mx-auto text-center">
                        {t.disclaimer}
                     </p>
                   </div>
                 </div>
               )}
            </div>

            <div data-html2canvas-ignore className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
               <button onClick={loadAllPerspectives} className={`py-6 text-[11px] font-black uppercase tracking-[0.3em] rounded-3xl transition-all active:scale-95 shadow-xl ${isRenoir ? 'bg-amber-900 text-white' : 'bg-black text-white'}`}>
                {t.readPerspectives}
               </button>
               <div className="relative">
                 <button onClick={() => setShowSaveMenu(!showSaveMenu)} className="w-full py-6 text-[11px] border-2 border-current/10 font-black uppercase tracking-[0.2em] rounded-3xl transition-all active:scale-95 flex items-center justify-center gap-2 hover:bg-current/5">
                  <Icons.Download /> {t.saveArtifact}
                 </button>
                 {showSaveMenu && (
                   <>
                     <div className="fixed inset-0 z-[590]" onClick={() => setShowSaveMenu(false)} />
                     <div className={`absolute bottom-full left-0 w-full mb-2 p-2 rounded-3xl border shadow-2xl z-[600] flex flex-col gap-1 backdrop-blur-2xl animate-in slide-in-from-bottom-2 ${isRenoir ? 'bg-amber-950/90 border-amber-900/40' : 'bg-white/90 border-black/10'}`}>
                        <button onClick={saveArtifactAsImage} className="w-full p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-current/10 text-left flex justify-between items-center group">{t.saveCard} <Icons.Download /></button>
                        <button onClick={savePictureOnly} className="w-full p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-current/10 text-left flex justify-between items-center group">{t.saveImage} <Icons.Download /></button>
                     </div>
                   </>
                 )}
               </div>
               <button onClick={() => setState(s => ({ ...s, status: 'IDLE' }))} className="py-6 text-[11px] border-2 border-current font-black uppercase tracking-[0.2em] rounded-3xl transition-all active:scale-95 hover:bg-red-600 hover:text-white hover:border-red-600">
                {t.newQuery}
               </button>
            </div>

            <div data-html2canvas-ignore className="flex justify-center -mt-6 gap-4">
              <button onClick={() => runQuery(state.query, false, Math.floor(Math.random() * 80) + 10)} className={`flex items-center gap-1.5 px-4 py-1 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 group ${isRenoir ? 'text-amber-500' : 'text-red-600'}`}>
                <Icons.Refresh />
                <span className="underline underline-offset-4 decoration-2 group-hover:decoration-current">{t.askAgain}</span>
              </button>
              <button onClick={handleRandomRequest} className="flex items-center gap-1.5 px-4 py-1 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 group text-amber-500">
                <Icons.Refresh />
                <span className="underline underline-offset-4 decoration-2 group-hover:decoration-current">{t.randomRequest}</span>
              </button>
            </div>

            <div className="pt-16 w-full border-t border-current/10 text-center">
               <span className="text-[11px] font-black uppercase opacity-40 tracking-[0.6em] block mb-10">{t.sources}</span>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full px-4">
                 {activeAnalysisData?.sources?.map((s, i) => s && (
                  <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className={`p-5 border-2 border-current/5 rounded-3xl hover:bg-current/5 transition-all flex justify-between items-center group`}>
                    <div className="flex flex-col text-left truncate">
                       <span className="text-[9px] font-black uppercase opacity-30 mb-1 tracking-widest">REF. {(i+1).toString().padStart(2, '0')}</span>
                       <span className="text-[11px] font-black uppercase leading-tight group-hover:underline truncate max-w-[200px]">{s?.title || "Source"}</span>
                    </div>
                    <Icons.External />
                  </a>
                 ))}
                 
                 {activeAnalysisData?.studyMoreUrl && (
                   <a data-html2canvas-ignore href={activeAnalysisData.studyMoreUrl} target="_blank" rel="noopener noreferrer" className={`p-5 border-2 border-current font-black uppercase transition-all flex justify-center items-center group md:col-span-2 mt-4 hover:bg-red-600 hover:text-white hover:border-red-600`}>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-black uppercase tracking-[0.3em]">
                        {activeAnalysisData.studyMoreLabel || t.studyFurther}
                      </span>
                      <Icons.Search />
                    </div>
                   </a>
                 )}
               </div>
            </div>
          </div>
        </div>

        {showPerspectivesModal && (
          <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-3xl overflow-y-auto font-sans flex items-start justify-center p-4 md:p-12" onClick={() => { setShowPerspectivesModal(false); stopAudio(); setIsMuted(true); }}>
            <div className="w-full max-w-4xl min-h-full flex flex-col items-center py-12" onClick={e => e.stopPropagation()}>
               <div className="w-full flex justify-between items-end mb-24 border-b-2 border-white/20 pb-12">
                  <div className="flex flex-col">
                    <span className="text-white/40 text-[11px] font-black uppercase tracking-[1.2em] mb-4">Council Proceedings</span>
                    <h2 className="text-2xl md:text-6xl font-black text-white uppercase tracking-tighter leading-[0.8]">{(r?.title || "Decree")?.replace(/\[\[|\]\]/g, '')}</h2>
                  </div>
                  <button onClick={() => { setShowPerspectivesModal(false); stopAudio(); setIsMuted(true); }} className="text-white p-4 border-2 border-white rounded-full hover:bg-white hover:text-black transition-all active:scale-90"><Icons.Close /></button>
               </div>
               <div className="w-full space-y-32 md:space-y-48">
                  {perspectivesList.map((p, idx) => {
                    const data = (r.perspectives as any)?.[frameworkKeyMap[p.frameworkType]];
                    if (!data) return null;
                    const isLoading = loadingFrameworks.has(frameworkKeyMap[p.frameworkType]);
                    const initials = data?.philosopherName?.split(' ').map((n: string) => n[0]).join('') || '?';
                    return (
                      <div key={p.id} className="relative group p-6 md:p-10 rounded-[40px] border border-white/5 bg-white/5 backdrop-blur-xl">
                         <div className="flex items-center gap-10 mb-12 border-b border-white/10 pb-8">
                            <span className="text-5xl md:text-8xl font-black text-white/5 select-none">{(idx + 1).toString().padStart(2, '0')}</span>
                            <div className="flex flex-col">
                               <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center text-xl font-black text-white">{initials}</div>
                                  <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-[0.3em]">{data.philosopherName}</h3>
                               </div>
                               <span className="text-white/40 text-[10px] uppercase tracking-widest mt-4 block">Doctrine: {p.label}</span>
                               <div className="flex flex-wrap gap-2 mt-4">
                                 {data.philosopherThemes?.map((theme: string) => (
                                   <span key={theme} className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[9px] font-black uppercase tracking-widest text-white/60">
                                     {theme}
                                   </span>
                                 ))}
                               </div>
                               <p className={`text-[12px] md:text-sm font-normal tracking-normal mt-6 px-4 py-2 border border-current inline-block rounded-xl ${isRenoir ? 'text-amber-500 border-amber-600' : 'text-red-600 border-red-600'}`}>
                                  {data.verdict}
                               </p>
                            </div>
                         </div>
                         <div className="max-w-3xl mx-auto space-y-12">
                            <TextBlock text={data.analysis} light dropCap isRenoir={isRenoir} isLoading={isLoading} loadingLabel={t.loadingAnalysis} />
                         </div>
                      </div>
                    );
                  })}
               </div>
               <div className="mt-48 mb-32">
                <button onClick={() => { setShowPerspectivesModal(false); stopAudio(); setIsMuted(true); }} className="px-24 py-6 bg-white text-black font-black uppercase tracking-[0.5em] text-[12px] hover:bg-red-600 hover:text-white transition-all shadow-2xl rounded-full">
                  {t.closeVerdict}
                </button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden ${isRenoir ? 'bg-[#0f0505] text-amber-100 font-serif' : 'bg-white text-black font-sans'}`}>
      <ThemeBackground theme={theme} />
      {GlobalUI}
      {HistorySidebar}
      {showProfilingModal && ProfilingModal}

      <div className="z-10 w-full max-w-2xl flex flex-col items-center justify-center space-y-4 md:space-y-6 h-full">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-[0.8] whitespace-pre-wrap select-none drop-shadow-2xl">
            {(t as any)?.title || "The Oracle"}
          </h1>
        </div>

        {learningProfile && (
          <div className={`px-4 py-1.5 rounded-full border flex items-center gap-3 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-700 ${isRenoir ? 'bg-amber-100/10 border-amber-900/40' : 'bg-zinc-100 border-black/5'}`}>
             <span className={`text-[9px] font-black uppercase tracking-widest ${isRenoir ? 'text-amber-500' : 'text-red-600'}`}>
               {t.profileActive}: {learningProfile.type}
             </span>
             <div className="w-px h-3 bg-current/20" />
             <button onClick={startProfiling} className="text-[9px] font-black uppercase opacity-40 hover:opacity-100 transition-opacity">Change</button>
             <button onClick={cancelProfile} className="text-[9px] font-black uppercase text-red-600 opacity-60 hover:opacity-100 transition-opacity">X</button>
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); runQuery(inputRef.current?.value || ""); }} className="w-full space-y-5 md:space-y-6 flex flex-col items-center">
          <div className="w-full max-lg relative">
            {!inputValue && (
              <div 
                className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-500 text-center text-base md:text-xl font-light italic
                  ${isInputFocused ? 'opacity-10' : 'opacity-30'}`}
              >
                {suggestions[ghostIndex]}
              </div>
            )}
            <input 
              ref={inputRef} 
              onChange={handleInputChange} 
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              className="w-full bg-transparent border-b-2 md:border-b-4 border-current/10 pb-2 text-center text-base md:text-xl font-light focus:outline-none focus:border-current transition-all placeholder:opacity-10 relative z-10" 
            />
          </div>
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex gap-3">
              <button type="button" onClick={() => { if(isManual) setState(s => ({ ...s, chaosScore: 50, logicScore: 50 })); setIsManual(!isManual); }} className={`flex items-center gap-2 px-5 py-2 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border-2 transition-all shadow-xl ${isManual ? (isRenoir ? 'bg-amber-100/15 border-amber-100/40 text-amber-100 ring-1 ring-red-500' : 'bg-zinc-100 border-black/40 text-black ring-1 ring-red-600') : 'opacity-40 border-current hover:opacity-100'}`}>
                <Icons.Settings /> {isManual ? t.cancelManual : t.manualCalibration}
              </button>
              <button type="button" onClick={handleRandomRequest} className={`flex items-center gap-2 px-5 py-2 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border-2 transition-all shadow-xl border-amber-500/50 text-amber-600 hover:bg-amber-500 hover:text-white`}>
                <Icons.Sparkle /> {t.randomRequest}
              </button>
            </div>
            
            {isManual && (
              <div className={`w-full max-w-[280px] p-5 border-2 rounded-2xl space-y-4 backdrop-blur-xl relative animate-in slide-in-from-top-4 ${isRenoir ? 'border-amber-900/40 bg-amber-950/20 text-amber-100/80' : 'border-black/5 bg-zinc-50/50 text-black/60'}`}>
                <div className="flex justify-between items-end text-[9px] font-black uppercase tracking-[0.2em]">
                   <span className="opacity-40">{t.logic}</span>
                   <span className={`text-[16px] font-black leading-none ${isRenoir ? 'text-amber-500' : 'text-red-600'}`}>{state.chaosScore}%</span>
                   <span className="text-red-600 opacity-60">{t.chaos}</span>
                </div>
                <div className="relative h-6 flex items-center">
                   <div className={`absolute left-0 right-0 h-[1px] ${isRenoir ? 'bg-amber-900/40' : 'bg-black/10'}`} />
                   <input 
                     type="range" 
                     min="0" 
                     max="100" 
                     value={state.chaosScore} 
                     onChange={e => { const c = parseInt(e.target.value); setState(s => ({ ...s, chaosScore: c, logicScore: 100 - c })); }} 
                     className="calibration-slider w-full h-full bg-transparent appearance-none cursor-pointer relative z-10" 
                   />
                </div>
              </div>
            )}
            
            <div className="relative w-full max-w-[280px] h-32 mt-0.5">
              {curiosities.map((item, idx) => {
                if (!item) return null;
                const position = (idx - curiosityOffset + 3) % 3;
                const scale = 1 - position * 0.05;
                const translateY = position * 12;
                
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => runQuery(item.query)}
                    style={{ 
                      transform: `translateY(${translateY}px) scale(${scale})`,
                      zIndex: 10 - position
                    }}
                    className={`absolute top-0 left-0 w-full p-5 border rounded-2xl flex flex-col text-left transition-all duration-500 ease-in-out group active:scale-95 ${isRenoir ? 'border-amber-900 bg-[#1e0a0a] text-amber-100/80' : 'border-zinc-300 bg-white text-black/60 hover:bg-zinc-50'}`}
                  >
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold leading-tight mb-2 transition-colors`}>
                        {item?.title || "Curiosity"}
                      </span>
                      <p className="text-[10px] leading-relaxed line-clamp-1 opacity-70 italic">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button type="submit" className={`w-24 h-24 md:w-28 md:h-28 mt-[-12px] font-black uppercase transition-all hover:scale-105 active:scale-95 shadow-2xl flex items-center justify-center group ${theme === 'SUPREMATIST' ? 'rounded-none rotate-3 hover:rotate-0' : 'rounded-[40px] md:rounded-[50px] scale-95 hover:scale-100'} ${isRenoir ? 'bg-amber-900 text-white' : 'bg-black text-white'}`}>
              <span className={`tracking-[0.1em] group-hover:tracking-[0.2em] transition-all leading-tight text-center px-4 ${uiLanguage === 'RU' ? 'text-[10px] md:text-[12px]' : 'text-xs md:text-sm'}`}>{t.ask}</span>
            </button>
          </div>
        </form>

        {!learningProfile && (
          <button 
            onClick={startProfiling}
            className={`mt-12 flex items-center gap-3 px-8 py-3 rounded-full border font-black uppercase tracking-[0.4em] text-[10px] transition-all hover:scale-105 active:scale-95 shadow-lg ${isRenoir ? 'bg-amber-900/10 border-amber-900/40 text-amber-500' : 'bg-zinc-100 border-black/5 text-black'}`}
          >
            <Icons.Mind /> {t.learningStyle}
          </button>
        )}
      </div>
      <footer className="absolute bottom-6 text-[8px] opacity-10 tracking-1em font-black select-none uppercase">{t.footer}</footer>
    </div>
  );
};
