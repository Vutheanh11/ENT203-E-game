let quizTimer;
let timeLeft = 60;
let correctAnswer = '';

const quizQuestions = [
    {
        question: "A short trip you take on Saturday and Sunday is called a ____.",
        options: ["A. business trip", "B. weekend getaway", "C. package tour", "D. honeymoon"],
        answer: "B"
    },
    {
        question: "If you want peace and quiet, you probably prefer a trip that's ____.",
        options: ["A. luxurious", "B. relaxing", "C. adventurous", "D. educational"],
        answer: "B"
    },
    {
        question: "A trip where you learn about history and art is ____.",
        options: ["A. relaxing", "B. educational", "C. romantic", "D. expensive"],
        answer: "B"
    },
    {
        question: "Which adjective does NOT usually describe a weekend getaway?",
        options: ["A. scenic", "B. inexpensive", "C. faraway", "D. luxurious"],
        answer: "C"
    },
    {
        question: '"I\'d rather stay in a nice hotel than go camping." → This person prefers trips that are more ____.',
        options: ["A. adventurous", "B. luxurious", "C. inexpensive", "D. active"],
        answer: "B"
    },
    {
        question: "She prefers ____ (go) on vacation in the mountains.",
        options: ["A. go", "B. going", "C. to go", "D. goes"],
        answer: "C"
    },
    {
        question: "I'd rather ____ (stay) home than go to a crowded beach.",
        options: ["A. stay", "B. staying", "C. to stay", "D. stayed"],
        answer: "A"
    },
    {
        question: "Which is correct?",
        options: ["A. I'd rather to relax on the beach.", "B. I'd rather relaxing on the beach.", "C. I'd rather relax on the beach."],
        answer: "C"
    },
    {
        question: '"How about going hiking this weekend?" – "I\'d just as soon ____ at home."',
        options: ["A. stay", "B. staying", "C. to stay", "D. stayed"],
        answer: "A"
    },
    {
        question: "Which word has the stress on the second syllable?",
        options: ["A. romantic", "B. relaxing", "C. expensive", "D. adventurous"],
        answer: "B"
    },
    {
        question: "I ___ stay in a five-star hotel than in a cheap hostel.",
        options: ["A. prefer", "B. 'd rather", "C. 'd prefer", "D. All are possible"],
        answer: "D"
    },
    {
        question: "She ___ to take a cruise next summer.",
        options: ["A. would rather", "B. prefers", "C. 'd prefer", "D. B & C"],
        answer: "D"
    },
    {
        question: '"Do you want to go skiing?" – "No, I\'d ___ go to the beach."',
        options: ["A. rather", "B. better", "C. prefer", "D. just as soon"],
        answer: "A"
    },
    {
        question: "You ___ book the hotel now. It's the last weekend of the holiday.",
        options: ["A. 'd rather", "B. 'd better", "C. prefer", "D. would"],
        answer: "B"
    },
    {
        question: "I'd just as soon ___ (not spend) too much money on this trip.",
        options: ["A. not spend", "B. not spending", "C. not to spend"],
        answer: "A"
    },
    {
        question: '"Have you decided where to go?" – "Yes, we ____ to Hawaii next month."',
        options: ["A. will go", "B. are going", "C. go"],
        answer: "B"
    },
    {
        question: '"I forgot to book the flight!" – "Don\'t worry, I ____ it right now."',
        options: ["A. will do", "B. am going to do", "C. do"],
        answer: "A"
    }
];

export function startMathQuiz(successCallback, failureCallback) {
    const modal = document.getElementById('math-modal');
    const questionEl = document.getElementById('math-question');
    const timerEl = document.getElementById('timer-display');
    const optionsContainer = document.getElementById('quiz-options');
    
    modal.classList.remove('hidden');
    
    // Pick random question
    const randomQuestion = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
    correctAnswer = randomQuestion.answer;
    
    questionEl.textContent = randomQuestion.question;
    
    // Clear and create option buttons
    optionsContainer.innerHTML = '';
    randomQuestion.options.forEach((option) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn';
        btn.textContent = option;
        btn.onclick = () => checkAnswer(option[0], successCallback, failureCallback);
        optionsContainer.appendChild(btn);
    });

    // Start Timer (60 seconds)
    timeLeft = 60;
    timerEl.textContent = `${timeLeft}s`;
    
    if (quizTimer) clearInterval(quizTimer);
    quizTimer = setInterval(() => {
        timeLeft--;
        timerEl.textContent = `${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(quizTimer);
            endQuiz(false, successCallback, failureCallback);
        }
    }, 1000);
}

function checkAnswer(selectedAnswer, successCallback, failureCallback) {
    if (selectedAnswer === correctAnswer) {
        endQuiz(true, successCallback, failureCallback);
    } else {
        endQuiz(false, successCallback, failureCallback);
    }
}

function endQuiz(success, successCallback, failureCallback) {
    clearInterval(quizTimer);
    document.getElementById('math-modal').classList.add('hidden');

    if (success) {
        successCallback();
    } else {
        alert("Time's up or Wrong Answer! No upgrade for you.");
        failureCallback();
    }
}
