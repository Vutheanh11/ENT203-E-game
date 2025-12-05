let mathTimer;
let timeLeft = 60;
let currentCorrectAnswer = '';

// English Quiz Question Bank
const quizQuestions = [
    {
        question: "I usually buy ________ before I enter the hall.",
        options: ["A. popcorn", "B. ticket", "C. cinema", "D. movie"],
        answer: "B"
    },
    {
        question: "My favorite type of film is an ________.",
        options: ["A. trailer", "B. cinema", "C. action movie", "D. ticket"],
        answer: "C"
    },
    {
        question: "We watched the ________ of the new Spider-Man movie.",
        options: ["A. cinema", "B. popcorn", "C. ticket", "D. trailer"],
        answer: "D"
    },
    {
        question: "We are ________ to the movies tonight.",
        options: ["A. go", "B. going", "C. goes", "D. went"],
        answer: "B"
    },
    {
        question: "She is ________ tickets for the 7 PM show.",
        options: ["A. buy", "B. buys", "C. buying", "D. bought"],
        answer: "C"
    },
    {
        question: "We decided to watch the 8 PM show, so we need to be at the cinema ____ 7:30.",
        options: ["A. at", "B. in", "C. on", "D. around"],
        answer: "D"
    },
    {
        question: "The movie was so exciting ____ everyone loved it.",
        options: ["A. because", "B. but", "C. that", "D. although"],
        answer: "C"
    },
    {
        question: "I usually check the movie ____ to see what is showing this week.",
        options: ["A. menu", "B. schedule", "C. paper", "D. book"],
        answer: "B"
    },
    {
        question: "The seats in this cinema are much more comfortable ____ the old one.",
        options: ["A. than", "B. then", "C. to", "D. from"],
        answer: "A"
    },
    {
        question: "She didn't go to the movies yesterday ____ she was sick.",
        options: ["A. because", "B. but", "C. so", "D. and"],
        answer: "A"
    },
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
        question: "I ___ stay in a five-star hotel than in a cheap hostel.",
        options: ["A. prefer", "B. 'd rather", "C. 'd prefer", "D. All are possible"],
        answer: "D"
    },
    {
        question: '"Have you decided where to go?" - "Yes, we ____ to Hawaii next month."',
        options: ["A. will go", "B. are going", "C. go", "D. went"],
        answer: "B"
    },
    {
        question: '"I forgot to book the flight!" - "Don\'t worry, I ____ it right now."',
        options: ["A. will do", "B. am going to do", "C. do", "D. did"],
        answer: "A"
    },
    {
        question: "Look at that black cloud! It ____ rain!",
        options: ["A. is going to", "B. will", "C. might", "D. may"],
        answer: "A"
    },
    {
        question: "Grammar: She prefers ____ (go) on vacation in the mountains.",
        options: ["A. go", "B. going", "C. to go", "D. goes"],
        answer: "C"
    },
    {
        question: "I'd rather ____ (stay) home than go to a crowded beach.",
        options: ["A. stay", "B. staying", "C. to stay", "D. stayed"],
        answer: "A"
    },
    {
        question: "You ___ book the hotel now. It's the last weekend of the holiday.",
        options: ["A. 'd rather", "B. 'd better", "C. prefer", "D. would"],
        answer: "B"
    },
    {
        question: "We might ____ (stay) an extra day if the weather is nice.",
        options: ["A. stay", "B. staying", "C. to stay", "D. stayed"],
        answer: "A"
    }
];

export function startMathQuiz(successCallback, failureCallback) {
    const modal = document.getElementById('math-modal');
    const questionEl = document.getElementById('math-question');
    const timerEl = document.getElementById('timer-display');
    const optionsContainer = document.getElementById('quiz-options');
    const submitBtn = document.getElementById('submit-answer');
    
    modal.classList.remove('hidden');
    
    // Pick random question
    const randomQuestion = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
    currentCorrectAnswer = randomQuestion.answer;
    
    // Display question
    questionEl.textContent = randomQuestion.question;
    
    // Display options as buttons
    optionsContainer.innerHTML = '';
    randomQuestion.options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn';
        btn.textContent = option;
        btn.dataset.answer = option.charAt(0); // Extract A, B, C, D
        btn.onclick = () => selectOption(btn);
        optionsContainer.appendChild(btn);
    });

    // Start Timer
    timeLeft = 60;
    timerEl.textContent = `${timeLeft}s`;
    
    if (mathTimer) clearInterval(mathTimer);
    mathTimer = setInterval(() => {
        timeLeft--;
        timerEl.textContent = `${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(mathTimer);
            endMathQuiz(false, successCallback, failureCallback);
        }
    }, 1000);

    submitBtn.onclick = () => checkAnswer(successCallback, failureCallback);
}

let selectedAnswer = null;

function selectOption(btn) {
    // Remove previous selection
    document.querySelectorAll('.quiz-option-btn').forEach(b => {
        b.classList.remove('selected');
    });
    
    // Mark as selected
    btn.classList.add('selected');
    selectedAnswer = btn.dataset.answer;
}

function checkAnswer(successCallback, failureCallback) {
    if (!selectedAnswer) {
        alert('Please select an answer!');
        return;
    }
    
    if (selectedAnswer === currentCorrectAnswer) {
        endMathQuiz(true, successCallback, failureCallback);
    } else {
        endMathQuiz(false, successCallback, failureCallback);
    }
    
    selectedAnswer = null;
}

function endMathQuiz(success, successCallback, failureCallback) {
    clearInterval(mathTimer);
    document.getElementById('math-modal').classList.add('hidden');
    
    // Clear handlers
    document.getElementById('submit-answer').onclick = null;
    
    // Clear selected answer
    selectedAnswer = null;

    if (success) {
        successCallback();
    } else {
        alert("Time's up or Wrong Answer! No upgrade for you.");
        failureCallback();
    }
}
