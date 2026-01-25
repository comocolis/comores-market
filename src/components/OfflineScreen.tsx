'use client';

import { useEffect, useState } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  fact: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  // Geography - Easy
  {
    question: "Combien d'îles principales composent l'archipel des Comores ?",
    options: ["2 îles", "3 îles", "4 îles", "5 îles"],
    correctAnswer: 2,
    category: "Géographie",
    fact: "Les Comores sont composées de 4 îles principales : Grande Comore (Ngazidja), Mohéli (Mwali), Anjouan (Ndzuwani) et Mayotte (Maore).",
    difficulty: "easy"
  },
  {
    question: "Quelle est la capitale des Comores ?",
    options: ["Mutsamudu", "Moroni", "Fomboni", "Mamoudzou"],
    correctAnswer: 1,
    category: "Géographie",
    fact: "Moroni, située sur l'île de Grande Comore, est la capitale politique et économique de l'Union des Comores depuis l'indépendance en 1975.",
    difficulty: "easy"
  },
  {
    question: "Quel volcan actif se trouve sur l'île de Grande Comore ?",
    options: ["Mont Fuji", "Mont Karthala", "Mont Ntringui", "Piton de la Fournaise"],
    correctAnswer: 1,
    category: "Géographie",
    fact: "Le Karthala (2361m) est l'un des volcans les plus actifs au monde. Sa dernière éruption majeure date de 2005, créant un lac de lave dans son cratère.",
    difficulty: "medium"
  },
  {
    question: "Dans quel océan se situent les Comores ?",
    options: ["Océan Atlantique", "Océan Indien", "Océan Pacifique", "Mer Méditerranée"],
    correctAnswer: 1,
    category: "Géographie",
    fact: "Les Comores sont situées dans l'océan Indien, entre Madagascar et la côte du Mozambique, au nord du canal du Mozambique.",
    difficulty: "easy"
  },

  // Culture - Easy to Hard
  {
    question: "Quelle est la langue officielle des Comores avec le français et l'arabe ?",
    options: ["Swahili", "Comorien (Shikomori)", "Malgache", "Bantou"],
    correctAnswer: 1,
    category: "Culture",
    fact: "Le Shikomori est une langue bantoue proche du swahili, avec des variantes sur chaque île : Shingazidja, Shimwali, Shindzuani et Shimaore.",
    difficulty: "easy"
  },
  {
    question: "Quel est le plat national comorien à base de banane plantain ?",
    options: ["Mataba", "Langouste à la vanille", "Pilaou", "Mabawa"],
    correctAnswer: 0,
    category: "Culture",
    fact: "Le Mataba est un plat emblématique fait de feuilles de manioc ou d'épinards, de viande et de lait de coco, souvent servi avec du riz ou de la banane plantain.",
    difficulty: "medium"
  },
  {
    question: "Quelle cérémonie traditionnelle marque le passage à l'âge adulte aux Comores ?",
    options: ["Le Maulida", "Le Grand Mariage (Anda na Harusi)", "Le Shigoma", "Le Toirab"],
    correctAnswer: 1,
    category: "Culture",
    fact: "Le Grand Mariage est une institution sociale majeure qui peut durer plusieurs jours et coûter des milliers d'euros. Il confère le statut de 'Grand Notable' dans la société.",
    difficulty: "hard"
  },
  {
    question: "Quel instrument de musique traditionnel est emblématique des Comores ?",
    options: ["Le Djembé", "Le Gabusi", "La Kora", "Le Balafon"],
    correctAnswer: 1,
    category: "Culture",
    fact: "Le Gabusi est une cithare traditionnelle comorienne utilisée dans la musique taarab, influencée par les traditions arabes, africaines et malgaches.",
    difficulty: "hard"
  },

  // History - Medium to Hard
  {
    question: "En quelle année les Comores ont-elles obtenu leur indépendance de la France ?",
    options: ["1960", "1975", "1980", "1968"],
    correctAnswer: 1,
    category: "Histoire",
    fact: "Les Comores ont proclamé leur indépendance le 6 juillet 1975. Ahmed Abdallah Abderemane devient le premier président de la République.",
    difficulty: "medium"
  },
  {
    question: "Quel sultan a régné sur Anjouan au 19ème siècle avant la colonisation française ?",
    options: ["Sultan Saïd Ali", "Sultan Abdallah III", "Sultan Ahmed", "Sultan Salim"],
    correctAnswer: 0,
    category: "Histoire",
    fact: "Le Sultan Saïd Ali d'Anjouan a signé un traité de protectorat avec la France en 1886, marquant le début de la colonisation française aux Comores.",
    difficulty: "hard"
  },
  {
    question: "Combien de coups d'État les Comores ont-elles connu depuis l'indépendance ?",
    options: ["Aucun", "5 coups d'État", "Plus de 20 tentatives", "2 coups d'État"],
    correctAnswer: 2,
    category: "Histoire",
    fact: "Les Comores détiennent un record mondial avec plus de 20 coups d'État ou tentatives depuis 1975, souvent impliquant le mercenaire Bob Denard.",
    difficulty: "hard"
  },

  // Nature & Environnement
  {
    question: "Quel animal marin emblématique peut-on observer aux Comores ?",
    options: ["Le requin-baleine", "Le coelacanthe", "La baleine à bosse", "Le dauphin"],
    correctAnswer: 1,
    category: "Nature",
    fact: "Le coelacanthe, un 'fossile vivant' datant de 400 millions d'années, a été redécouvert aux Comores en 1938. Il peut vivre jusqu'à 200m de profondeur.",
    difficulty: "medium"
  },
  {
    question: "Quelle espèce endémique de chauve-souris vit aux Comores ?",
    options: ["La roussette des Comores", "Le vampire comorien", "La pipistrelle géante", "Le renard volant"],
    correctAnswer: 0,
    category: "Nature",
    fact: "La roussette des Comores (Pteropus livingstonii) est une espèce en danger critique. On n'en compte que 1200 individus, principalement à Anjouan.",
    difficulty: "hard"
  },
  {
    question: "Quelle fleur est particulièrement cultivée aux Comores pour l'exportation ?",
    options: ["La rose", "La tulipe", "L'ylang-ylang", "Le jasmin"],
    correctAnswer: 2,
    category: "Nature",
    fact: "Les Comores produisent 80% de l'ylang-ylang mondial, utilisé dans les parfums de luxe. L'essence d'ylang-ylang est appelée 'or jaune' comorien.",
    difficulty: "easy"
  },

  // Économie & Société
  {
    question: "Quelle est la monnaie officielle des Comores ?",
    options: ["Le Franc CFA", "Le Franc comorien", "L'Ariary", "Le Shilling"],
    correctAnswer: 1,
    category: "Économie",
    fact: "Le Franc comorien (KMF) est la monnaie nationale depuis 1975. 1 euro équivaut à environ 492 francs comoriens (taux fixe).",
    difficulty: "easy"
  },
  {
    question: "Quel produit agricole est surnommé 'l'or rouge' des Comores ?",
    options: ["Le café", "La vanille", "Le clou de girofle", "Le cacao"],
    correctAnswer: 1,
    category: "Économie",
    fact: "La vanille Bourbon des Comores est réputée mondialement pour sa qualité exceptionnelle. Le pays est le 3ème producteur mondial après Madagascar et l'Indonésie.",
    difficulty: "medium"
  },
  {
    question: "Quelle île comorienne est restée sous administration française ?",
    options: ["Grande Comore", "Mohéli", "Anjouan", "Mayotte"],
    correctAnswer: 3,
    category: "Géographie",
    fact: "Mayotte a choisi de rester française lors du référendum de 1974 et est devenue le 101ème département français en 2011, une situation toujours contestée par l'Union des Comores.",
    difficulty: "medium"
  },

  // Religion & Traditions
  {
    question: "Quelle est la religion majoritaire aux Comores ?",
    options: ["Christianisme", "Islam sunnite", "Hindouisme", "Animisme"],
    correctAnswer: 1,
    category: "Culture",
    fact: "Plus de 99% des Comoriens sont musulmans sunnites. L'islam est arrivé aux Comores au 7ème siècle via les marchands arabes et persans.",
    difficulty: "easy"
  },
  {
    question: "Quel événement religieux est célébré avec le plus de ferveur aux Comores ?",
    options: ["Le Ramadan", "Le Maulida (naissance du Prophète)", "L'Aïd el-Fitr", "Le Hajj"],
    correctAnswer: 1,
    category: "Culture",
    fact: "Le Maulida est célébré avec une ferveur unique aux Comores, avec des processions, des chants religieux et des festivités durant plusieurs jours dans chaque village.",
    difficulty: "medium"
  },

  // Gastronomie
  {
    question: "Quelle épice produite aux Comores est utilisée dans le Coca-Cola ?",
    options: ["La cannelle", "La muscade", "La vanille", "Le clou de girofle"],
    correctAnswer: 2,
    category: "Gastronomie",
    fact: "La vanille comorienne est utilisée dans la recette secrète de Coca-Cola. Les Comores exportent environ 30 tonnes de vanille par an.",
    difficulty: "hard"
  },
  {
    question: "Quel poisson est couramment utilisé dans la cuisine comorienne ?",
    options: ["Le saumon", "Le thon", "La carpe", "La truite"],
    correctAnswer: 1,
    category: "Gastronomie",
    fact: "Le thon frais est un aliment de base, souvent grillé et servi avec du riz au lait de coco (pilaou). Les eaux comoriennes sont riches en thons albacore et patudo.",
    difficulty: "easy"
  }
];

export default function OfflineScreen() {
  const [isOnline, setIsOnline] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // Check online status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Load high score
    const savedHighScore = localStorage.getItem('comoros_quiz_highscore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }

    const savedBestStreak = localStorage.getItem('comoros_quiz_best_streak');
    if (savedBestStreak) {
      setBestStreak(parseInt(savedBestStreak));
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const startQuiz = () => {
    setQuizStarted(true);
    setQuizCompleted(false);
    setCurrentQuestion(0);
    setScore(0);
    setCorrectAnswers(0);
    setStreak(0);
    setShowAnswer(false);
    setSelectedAnswer(null);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showAnswer) return;

    setSelectedAnswer(answerIndex);
    setShowAnswer(true);

    const question = QUIZ_QUESTIONS[currentQuestion];
    const isCorrect = answerIndex === question.correctAnswer;

    if (isCorrect) {
      const points = question.difficulty === 'easy' ? 10 : question.difficulty === 'medium' ? 20 : 30;
      const streakBonus = streak >= 3 ? 10 : 0;
      setScore(prev => prev + points + streakBonus);
      setCorrectAnswers(prev => prev + 1);
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak > bestStreak) {
          setBestStreak(newStreak);
          localStorage.setItem('comoros_quiz_best_streak', newStreak.toString());
        }
        return newStreak;
      });
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setShowAnswer(false);
      setSelectedAnswer(null);
    } else {
      setQuizCompleted(true);
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('comoros_quiz_highscore', score.toString());
      }
    }
  };

  const handleRetryConnection = () => {
    window.location.reload();
  };

  if (isOnline) {
    return null;
  }

  const question = QUIZ_QUESTIONS[currentQuestion];
  const progressPercent = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;

  return (
    <div className="fixed inset-0 z-9999 bg-linear-to-br from-emerald-900 via-teal-800 to-cyan-900 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center px-4 py-8">
        <div className="text-center text-white w-full max-w-xl">
        
        {/* Header Stats */}
        <div className="flex justify-between items-start mb-4 gap-2">
          {/* High Score */}
          <div className="bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 rounded-lg px-3 py-1.5 flex-1">
            <div className="flex items-center gap-1 text-amber-400 justify-center">
              <span className="text-lg">🏆</span>
              <div className="text-left">
                <div className="text-[10px] opacity-75">Record</div>
                <div className="text-sm font-bold">{highScore}</div>
              </div>
            </div>
          </div>

          {/* Current Score */}
          {quizStarted && !quizCompleted && (
            <div className="bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-lg px-3 py-1.5 flex-1">
              <div className="flex items-center gap-1 text-emerald-300 justify-center">
                <span className="text-lg">⭐</span>
                <div className="text-left">
                  <div className="text-[10px] opacity-75">Score</div>
                  <div className="text-sm font-bold">{score}</div>
                </div>
              </div>
            </div>
          )}

          {/* Streak */}
          {streak > 0 && quizStarted && !quizCompleted && (
            <div className="bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 rounded-lg px-3 py-1.5 flex-1">
              <div className="flex items-center gap-1 text-orange-300 justify-center">
                <span className="text-lg">🔥</span>
                <div className="text-left">
                  <div className="text-[10px] opacity-75">Série</div>
                  <div className="text-sm font-bold">{streak}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        {!quizStarted ? (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-4">
            <div className="text-5xl mb-4">🇰🇲</div>
            <h1 className="text-3xl font-bold mb-2 bg-linear-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
              Quiz des Comores
            </h1>
            <p className="text-gray-200 mb-1.5 text-base">Pas de connexion Internet ?</p>
            <p className="text-gray-300 mb-6 text-sm">
              Découvrez la richesse des Comores à travers ce quiz interactif !
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6 text-left">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-xl mb-1">🌍</div>
                <div className="text-xs font-semibold text-emerald-300">Géographie</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Îles, volcans, nature</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-xl mb-1">🎭</div>
                <div className="text-xs font-semibold text-cyan-300">Culture</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Traditions, langue, art</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-xl mb-1">📚</div>
                <div className="text-xs font-semibold text-blue-300">Histoire</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Événements marquants</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-xl mb-1">🌺</div>
                <div className="text-xs font-semibold text-pink-300">Nature</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Faune, flore endémique</div>
              </div>
            </div>

            <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-blue-200">
                <span className="font-bold">{QUIZ_QUESTIONS.length} questions</span> • 
                Facile (10pts) • Moyen (20pts) • Difficile (30pts)
              </p>
              <p className="text-xs text-blue-300/70 mt-2">
                Bonus de 10 points pour 3+ bonnes réponses d'affilée ! 🔥
              </p>
            </div>

            <button
              onClick={startQuiz}
              className="bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold px-8 py-3 rounded-xl transition-all transform hover:scale-105 text-base shadow-lg"
            >
              Commencer le Quiz
            </button>

            {bestStreak > 0 && (
              <p className="text-amber-400 text-sm mt-6">
                🏅 Meilleure série : {bestStreak} bonne{bestStreak > 1 ? 's' : ''} réponse{bestStreak > 1 ? 's' : ''} d'affilée
              </p>
            )}
          </div>
        ) : quizCompleted ? (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-4">
            <div className="text-5xl mb-4">
              {correctAnswers >= QUIZ_QUESTIONS.length * 0.8 ? '🎉' : correctAnswers >= QUIZ_QUESTIONS.length * 0.5 ? '👏' : '💪'}
            </div>
            <h2 className="text-3xl font-bold mb-3 bg-linear-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent">
              Quiz Terminé !
            </h2>
            
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <div className="text-4xl font-bold mb-2 text-emerald-300">{score}</div>
              <div className="text-gray-300 mb-3 text-sm">points au total</div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-2xl mb-1">✅</div>
                  <div className="font-semibold text-green-300">{correctAnswers}/{QUIZ_QUESTIONS.length}</div>
                  <div className="text-xs text-gray-300">Bonnes réponses</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-2xl mb-1">📊</div>
                  <div className="font-semibold text-blue-300">{Math.round((correctAnswers / QUIZ_QUESTIONS.length) * 100)}%</div>
                  <div className="text-xs text-gray-300">Taux de réussite</div>
                </div>
              </div>
            </div>

            {score > highScore - (score > 0 ? score : 1) && score > 0 && (
              <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4 mb-6">
                <p className="text-amber-300 font-bold flex items-center justify-center gap-2">
                  <span className="text-2xl">🏆</span> Nouveau record personnel !
                </p>
              </div>
            )}

            <p className="text-gray-300 mb-6">
              {correctAnswers >= QUIZ_QUESTIONS.length * 0.8 
                ? "Excellent ! Vous êtes un véritable expert des Comores ! 🌟"
                : correctAnswers >= QUIZ_QUESTIONS.length * 0.5
                ? "Bien joué ! Vous connaissez bien les Comores ! 👍"
                : "Continuez à apprendre sur les merveilleuses Comores ! 📚"}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={startQuiz}
                className="bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold px-8 py-3 rounded-xl transition-all transform hover:scale-105"
              >
                Rejouer
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 mb-4">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-emerald-300 font-semibold">Question {currentQuestion + 1}/{QUIZ_QUESTIONS.length}</span>
                <span className="text-gray-300">{question.category}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div 
                  className={`bg-linear-to-r from-emerald-400 to-cyan-400 h-2 rounded-full transition-all duration-500 ${
                    progressPercent >= 100 ? 'w-full' :
                    progressPercent >= 95 ? 'w-[95%]' :
                    progressPercent >= 90 ? 'w-[90%]' :
                    progressPercent >= 85 ? 'w-[85%]' :
                    progressPercent >= 80 ? 'w-[80%]' :
                    progressPercent >= 75 ? 'w-[75%]' :
                    progressPercent >= 70 ? 'w-[70%]' :
                    progressPercent >= 65 ? 'w-[65%]' :
                    progressPercent >= 60 ? 'w-[60%]' :
                    progressPercent >= 55 ? 'w-[55%]' :
                    progressPercent >= 50 ? 'w-1/2' :
                    progressPercent >= 45 ? 'w-[45%]' :
                    progressPercent >= 40 ? 'w-2/5' :
                    progressPercent >= 35 ? 'w-[35%]' :
                    progressPercent >= 30 ? 'w-[30%]' :
                    progressPercent >= 25 ? 'w-1/4' :
                    progressPercent >= 20 ? 'w-1/5' :
                    progressPercent >= 15 ? 'w-[15%]' :
                    progressPercent >= 10 ? 'w-[10%]' :
                    progressPercent >= 5 ? 'w-[5%]' : 'w-0'
                  }`}
                ></div>
              </div>
            </div>

            {/* Difficulty Badge */}
            <div className="flex justify-center mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                question.difficulty === 'easy' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                question.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                {question.difficulty === 'easy' ? '⭐ Facile (10pts)' : 
                 question.difficulty === 'medium' ? '⭐⭐ Moyen (20pts)' : 
                 '⭐⭐⭐ Difficile (30pts)'}
              </span>
            </div>

            {/* Question */}
            <h3 className="text-xl font-bold mb-4 text-white leading-relaxed">
              {question.question}
            </h3>

            {/* Options */}
            <div className="space-y-2.5 mb-4">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === question.correctAnswer;
                const showCorrect = showAnswer && isCorrect;
                const showIncorrect = showAnswer && isSelected && !isCorrect;

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showAnswer}
                    className={`w-full p-3 rounded-lg text-sm text-left transition-all transform hover:scale-[1.02] font-medium ${
                      showCorrect
                        ? 'bg-green-500/30 border-2 border-green-400 text-green-100'
                        : showIncorrect
                        ? 'bg-red-500/30 border-2 border-red-400 text-red-100'
                        : isSelected
                        ? 'bg-white/20 border-2 border-white/40 text-white'
                        : 'bg-white/5 border-2 border-white/10 hover:bg-white/10 hover:border-white/30 text-gray-200'
                    } ${showAnswer ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {showCorrect && <span className="text-2xl">✓</span>}
                      {showIncorrect && <span className="text-2xl">✗</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Fact Display */}
            {showAnswer && (
              <div className={`p-3 rounded-lg mb-4 ${
                selectedAnswer === question.correctAnswer
                  ? 'bg-green-500/20 border border-green-500/30'
                  : 'bg-blue-500/20 border border-blue-500/30'
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">💡</span>
                  <div className="text-left">
                    <div className="font-semibold text-white mb-1">Le saviez-vous ?</div>
                    <p className="text-sm text-gray-200 leading-relaxed">{question.fact}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Next Button */}
            {showAnswer && (
              <button
                onClick={handleNext}
                className="bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold px-8 py-3 rounded-xl transition-all transform hover:scale-105 w-full"
              >
                {currentQuestion < QUIZ_QUESTIONS.length - 1 ? 'Question Suivante →' : 'Voir les Résultats 🎯'}
              </button>
            )}
          </div>
        )}

        {/* Retry Connection Button */}
        <button
          onClick={handleRetryConnection}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-all inline-flex items-center gap-2"
        >
          <span>🔄</span>
          Réessayer la connexion
        </button>

        <p className="text-sm text-gray-400 mt-4">
          La page se rechargera automatiquement une fois la connexion rétablie
        </p>
        </div>
      </div>
    </div>
  );
}
