// wait for the dom tree to load completely before executing script logic
document.addEventListener("DOMContentLoaded", function () {

  // grab dom elements for main application views and container screens
  const authContainer = document.getElementById("authContainer");
  const centeredLoginContainer = document.getElementById("centeredLoginContainer");
  const symptomsView = document.getElementById("symptomsView");
  const dashboardView = document.getElementById("dashboardView");

  // grab navigation links and view switcher buttons
  const switchToLogin = document.getElementById("switchToLogin");
  const switchToSignup = document.getElementById("switchToSignup");
  const createAccountBtn = document.getElementById("createAccountBtn");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // grab input form fields for login and sign up
  const signupUsername = document.getElementById("signupUsername");
  const signupPassword = document.getElementById("signupPassword");
  const loginUsername = document.getElementById("loginUsername");
  const loginPassword = document.getElementById("loginPassword");

  // grab symptom selection cards and action buttons
  const symptomCards = document.querySelectorAll(".symptom-card");
  const symptomCountText = document.getElementById("symptomCountText");
  const symptomsContinueBtn = document.getElementById("symptomsContinueBtn");
  const selectedSymptoms = new Set();

  // grab custom notification modal elements
  const customModal = document.getElementById("customModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalCloseBtn = document.getElementById("modalCloseBtn");

  // grab focus timer readout display and mode buttons
  const timerDisplay = document.getElementById("timerDisplay");
  const timerPhaseText = document.getElementById("timerPhaseText");
  const startTimerBtn = document.getElementById("startTimerBtn");
  const pauseTimerBtn = document.getElementById("pauseTimerBtn");
  const resetTimerBtn = document.getElementById("resetTimerBtn");
  const timerModeBtns = document.querySelectorAll(".timer-mode-btn");

  // initialize default countdown timer variables
  let workDurationMinutes = 25;
  let breakDurationMinutes = 5;
  let timeRemainingSeconds = workDurationMinutes * 60;
  let timerInterval = null;
  let isTimerRunning = false;
  let isWorkPhase = true;

  // helper function to pop up notification alerts using the custom modal
  function showAlertModal(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    customModal.classList.remove("hidden");
  }

  // close custom notification modal on button click
  modalCloseBtn.addEventListener("click", function () {
    customModal.classList.add("hidden");
  });

  // switch display from signup split screen to centered login view
  switchToLogin.addEventListener("click", function (event) {
    event.preventDefault();
    authContainer.classList.add("hidden");
    centeredLoginContainer.classList.remove("hidden");
  });

  // switch display from centered login view back to signup split screen
  switchToSignup.addEventListener("click", function (event) {
    event.preventDefault();
    centeredLoginContainer.classList.add("hidden");
    authContainer.classList.remove("hidden");
  });

  // handle create account button validation, duplicate username check, and navigation
  createAccountBtn.addEventListener("click", function () {
    const username = signupUsername.value.trim();
    const password = signupPassword.value.trim();

    // validate empty inputs
    if (username === "" || password === "") {
      showAlertModal("Missing Information", "Please enter both a username and a password.");
      return;
    }

    // validate password length
    if (password.length < 6) {
      showAlertModal("Password Too Short", "Please choose a password that is at least 6 characters long.");
      return;
    }

    // check if the entered username already exists in local storage
    const userKey = "ergoUser_" + username;
    if (localStorage.getItem(userKey)) {
      showAlertModal("Username Exists", "This username already exists. Please choose another one or log in.");
      return;
    }

    // save account credentials to local storage and move to symptom selection screen
    localStorage.setItem(userKey, password);
    localStorage.setItem("currentActiveUser", username);

    authContainer.classList.add("hidden");
    symptomsView.classList.remove("hidden");
  });

  // handle login form validation and navigation to dashboard
  loginBtn.addEventListener("click", function () {
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();

    // validate empty inputs
    if (username === "" || password === "") {
      showAlertModal("Login Error", "Please enter your username and password.");
      return;
    }

    // transition to dashboard view and load saved stretch preferences
    centeredLoginContainer.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    loadUserStretchPreferences();
  });

  // handle clicking symptom cards to toggle active selection
  symptomCards.forEach(function (card) {
    card.addEventListener("click", function () {
      const symptomKey = card.getAttribute("data-symptom");

      // add or remove selected card styling and track key in set
      if (card.classList.contains("selected")) {
        card.classList.remove("selected");
        selectedSymptoms.delete(symptomKey);
      } else {
        card.classList.add("selected");
        selectedSymptoms.add(symptomKey);
      }

      // update continue button state based on selection count
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

  // save user symptom choices to local storage and proceed to dashboard
  symptomsContinueBtn.addEventListener("click", function () {
    if (selectedSymptoms.size > 0) {
      localStorage.setItem("userSymptoms", JSON.stringify(Array.from(selectedSymptoms)));
      symptomsView.classList.add("hidden");
      dashboardView.classList.remove("hidden");
      loadUserStretchPreferences();
    }
  });

  // automatically sync dashboard toggle switches with saved setup choices
  function loadUserStretchPreferences() {
    const savedSymptoms = JSON.parse(localStorage.getItem("userSymptoms")) || [];

    // mapping setup symptom keys directly to matching dashboard toggles
    const preferenceMap = {
      "eyes": document.getElementById("stretchEyeToggle"),
      "neck": document.getElementById("stretchNeckToggle"),
      "back": document.getElementById("stretchBackToggle"),
      "wrist": document.getElementById("stretchWristToggle"),
      "hip": document.getElementById("stretchHipToggle"),
      "headache": document.getElementById("stretchHeadacheToggle")
    };

    // check or uncheck toggles based on saved array
    Object.keys(preferenceMap).forEach(key => {
      const toggle = preferenceMap[key];
      if (toggle) {
        toggle.checked = savedSymptoms.includes(key);
      }
    });
  }

  // handle dashboard logout button to reset inputs and return to login screen
  logoutBtn.addEventListener("click", function () {
    signupUsername.value = "";
    signupPassword.value = "";
    loginUsername.value = "";
    loginPassword.value = "";

    dashboardView.classList.add("hidden");
    centeredLoginContainer.classList.remove("hidden");
  });

  // format time remaining in mm:ss format and update timer readout text
  function updateTimerDisplay() {
    const minutes = Math.floor(timeRemainingSeconds / 60);
    const seconds = timeRemainingSeconds % 60;
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
    const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
    timerDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
  }

  // start focus timer countdown interval
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
        
        // switch timer phases between work focus and break time
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

  // pause running timer interval
  function pauseTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
  }

  // reset timer back to selected phase starting time
  function resetTimer() {
    pauseTimer();
    isWorkPhase = true;
    timeRemainingSeconds = workDurationMinutes * 60;
    timerPhaseText.textContent = "Focus Phase";
    updateTimerDisplay();
  }

  // attach event listeners to timer control buttons
  startTimerBtn.addEventListener("click", startTimer);
  pauseTimerBtn.addEventListener("click", pauseTimer);
  resetTimerBtn.addEventListener("click", resetTimer);

  // handle selecting different timer mode presets
  timerModeBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      timerModeBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");

      workDurationMinutes = parseInt(btn.getAttribute("data-work"), 10);
      breakDurationMinutes = parseInt(btn.getAttribute("data-break"), 10);
      resetTimer();
    });
  });

  // initial call to render default timer time on screen load
  updateTimerDisplay();
});