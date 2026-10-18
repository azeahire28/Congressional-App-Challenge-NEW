document.addEventListener("DOMContentLoaded", function () {

  // grab dom elements for views and containers
  const authContainer = document.getElementById("authContainer");
  const centeredLoginContainer = document.getElementById("centeredLoginContainer");
  const symptomsView = document.getElementById("symptomsView");
  const dashboardView = document.getElementById("dashboardView");

  // grab navigation links and buttons
  const switchToLogin = document.getElementById("switchToLogin");
  const switchToSignup = document.getElementById("switchToSignup");
  const createAccountBtn = document.getElementById("createAccountBtn");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // grab input fields for forms
  const signupUsername = document.getElementById("signupUsername");
  const signupPassword = document.getElementById("signupPassword");
  const loginUsername = document.getElementById("loginUsername");
  const loginPassword = document.getElementById("loginPassword");

  // grab symptom selection elements
  const symptomCards = document.querySelectorAll(".symptom-card");
  const symptomCountText = document.getElementById("symptomCountText");
  const symptomsContinueBtn = document.getElementById("symptomsContinueBtn");
  const selectedSymptoms = new Set();

  // grab modal popup elements
  const customModal = document.getElementById("customModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalCloseBtn = document.getElementById("modalCloseBtn");

  // grab timer display and control buttons
  const timerDisplay = document.getElementById("timerDisplay");
  const timerPhaseText = document.getElementById("timerPhaseText");
  const startTimerBtn = document.getElementById("startTimerBtn");
  const pauseTimerBtn = document.getElementById("pauseTimerBtn");
  const resetTimerBtn = document.getElementById("resetTimerBtn");
  const timerModeBtns = document.querySelectorAll(".timer-mode-btn");

  // set up timer variables
  let workDurationMinutes = 25;
  let breakDurationMinutes = 5;
  let timeRemainingSeconds = workDurationMinutes * 60;
  let timerInterval = null;
  let isTimerRunning = false;
  let isWorkPhase = true;

  // helper function to show alerts with custom modal
  function showAlertModal(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    customModal.classList.remove("hidden");
  }

  modalCloseBtn.addEventListener("click", function () {
    customModal.classList.add("hidden");
  });

  // switch view from signup to login
  switchToLogin.addEventListener("click", function (event) {
    event.preventDefault();
    authContainer.classList.add("hidden");
    centeredLoginContainer.classList.remove("hidden");
  });

  // switch view from login back to signup
  switchToSignup.addEventListener("click", function (event) {
    event.preventDefault();
    centeredLoginContainer.classList.remove("hidden");
    authContainer.classList.remove("hidden");
  });

  // handle create account validation and transition
  createAccountBtn.addEventListener("click", function () {
    const username = signupUsername.value.trim();
    const password = signupPassword.value.trim();

    if (username === "" || password === "") {
      showAlertModal("Missing Information", "Please enter both a username and a password.");
      return;
    }

    if (password.length < 6) {
      showAlertModal("Password Too Short", "Please choose a password that is at least 6 characters long.");
      return;
    }

    authContainer.classList.add("hidden");
    symptomsView.classList.remove("hidden");
  });

  // handle login validation, transition, and load preferences
  loginBtn.addEventListener("click", function () {
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();

    if (username === "" || password === "") {
      showAlertModal("Login Error", "Please enter your username and password.");
      return;
    }

    centeredLoginContainer.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    loadUserStretchPreferences();
  });

  // handle clicking symptom cards to toggle selection
  symptomCards.forEach(function (card) {
    card.addEventListener("click", function () {
      const symptomKey = card.getAttribute("data-symptom");

      if (card.classList.contains("selected")) {
        card.classList.remove("selected");
        selectedSymptoms.delete(symptomKey);
      } else {
        card.classList.add("selected");
        selectedSymptoms.add(symptomKey);
      }

      if (selectedSymptoms.size > 0) {
        symptomsContinueBtn.removeAttribute("disabled");
        symptomsContinueBtn.classList.remove("disabled-btn");
        symptomCountText.textContent = `${selectedSymptoms.size} symptom area(s) selected.`;
      } else {
        symptomsContinueBtn.setAttribute("disabled", "true");
        symptomsContinueBtn.classList.add("disabled-btn");
        symptomCountText.textContent = "Please select at least 1 symptom to continue.";
      }
    });
  });

  // continue to dashboard from symptoms screen, save choices, and apply preferences
  symptomsContinueBtn.addEventListener("click", function () {
    if (selectedSymptoms.size > 0) {
      localStorage.setItem("userSymptoms", JSON.stringify(Array.from(selectedSymptoms)));
      symptomsView.classList.add("hidden");
      dashboardView.classList.remove("hidden");
      loadUserStretchPreferences();
    }
  });

  // automatically update dashboard toggles based on saved setup choices
  function loadUserStretchPreferences() {
    const savedSymptoms = JSON.parse(localStorage.getItem("userSymptoms")) || [];

    const preferenceMap = {
      "eyes": document.getElementById("stretchEyeToggle"),
      "neck": document.getElementById("stretchNeckToggle"),
      "back": document.getElementById("stretchBackToggle"),
      "wrist": document.getElementById("stretchWristToggle"),
      "legs": document.getElementById("stretchHipToggle"),
      "shoulders": document.getElementById("stretchNeckToggle")
    };

    Object.keys(preferenceMap).forEach(key => {
      const toggle = preferenceMap[key];
      if (toggle) {
        toggle.checked = savedSymptoms.includes(key);
      }
    });
  }

  // handle dashboard logout back to login screen
  logoutBtn.addEventListener("click", function () {
    signupUsername.value = "";
    signupPassword.value = "";
    loginUsername.value = "";
    loginPassword.value = "";

    dashboardView.classList.add("hidden");
    centeredLoginContainer.classList.remove("hidden");
  });

  // update formatted time remaining on timer display
  function updateTimerDisplay() {
    const minutes = Math.floor(timeRemainingSeconds / 60);
    const seconds = timeRemainingSeconds % 60;
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
    const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
    timerDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
  }

  // start countdown timer interval
  function startTimer() {
    if (isTimerRunning) return;
    
    isTimerRunning = true;

    timerInterval = setInterval(function () {
      if (timeRemainingSeconds > 0) {
        timeRemainingSeconds--;
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        isTimerRunning = false;
        
        if (isWorkPhase) {
          isWorkPhase = false;
          timeRemainingSeconds = breakDurationMinutes * 60;
          timerPhaseText.textContent = "Stretch Break Phase";
          showAlertModal("Time to Stretch!", "Take a quick break and perform your ergonomic stretches.");
        } else {
          isWorkPhase = true;
          timeRemainingSeconds = workDurationMinutes * 60;
          timerPhaseText.textContent = "Focus Phase";
          showAlertModal("Break Complete", "Ready to start your next focus session?");
        }
        
        updateTimerDisplay();
      }
    }, 1000);
  }

  // pause countdown timer
  function pauseTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
  }

  // reset timer back to initial duration
  function resetTimer() {
    pauseTimer();
    isWorkPhase = true;
    timeRemainingSeconds = workDurationMinutes * 60;
    timerPhaseText.textContent = "Focus Phase";
    updateTimerDisplay();
  }

  // timer button event listeners
  startTimerBtn.addEventListener("click", startTimer);
  pauseTimerBtn.addEventListener("click", pauseTimer);
  resetTimerBtn.addEventListener("click", resetTimer);

  // handle clicking different timer mode preset buttons
  timerModeBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      timerModeBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");

      workDurationMinutes = parseInt(btn.getAttribute("data-work"), 10);
      breakDurationMinutes = parseInt(btn.getAttribute("data-break"), 10);
      resetTimer();
    });
  });

  updateTimerDisplay();
});