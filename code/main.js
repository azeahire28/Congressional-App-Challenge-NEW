document.addEventListener("DOMContentLoaded", function () {

  // Grab references to all main container views for dynamic screen switching
  const signupView = document.getElementById("signupView");
  const loginView = document.getElementById("loginView");
  const symptomsView = document.getElementById("symptomsView");
  const dashboardView = document.getElementById("dashboardView");

  // Grab navigation triggers and buttons across authentication flows
  const showLoginLink = document.getElementById("showLoginLink");
  const showSignupLink = document.getElementById("showSignupLink");
  const createAccountButton = document.getElementById("createAccountButton");
  const loginButton = document.getElementById("loginButton");
  const logoutButton = document.getElementById("logoutButton");

  // Grab input fields for signup and login forms
  const signupUsernameInput = document.getElementById("signupUsernameInput");
  const signupPasswordInput = document.getElementById("signupPasswordInput");
  const loginUsernameInput = document.getElementById("loginUsernameInput");
  const loginPasswordInput = document.getElementById("loginPasswordInput");

  // Grab symptom cards, continue button, and tracking collection set
  const symptomCards = document.querySelectorAll(".symptom-card");
  const startWellnessButton = document.getElementById("startWellnessButton");
  const selectedSymptoms = new Set();

  // Grab toggle elements on the dashboard settings panel
  const preferenceMap = {
    "Eye Strain": document.getElementById("stretchEyeToggle"),
    "Neck Tension": document.getElementById("stretchNeckToggle"),
    "Back & Posture": document.getElementById("stretchBackToggle"),
    "Wrist & Hand Tension": document.getElementById("stretchWristToggle"),
    "Hip tightness": document.getElementById("stretchHipToggle"),
    "Tension Headaches": document.getElementById("stretchHeadacheToggle")
  };

  // Grab custom modal elements for validation messages and alerts
  const customModal = document.getElementById("customModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalCloseBtn = document.getElementById("modalCloseBtn");

  // Grab focus timer display elements, status text, and control buttons
  const timerDisplay = document.getElementById("timerDisplay");
  const timerPhaseText = document.getElementById("timerPhaseText");
  const startTimerBtn = document.getElementById("startTimerBtn");
  const pauseTimerBtn = document.getElementById("pauseTimerBtn");
  const resetTimerBtn = document.getElementById("resetTimerBtn");
  const timerModeBtns = document.querySelectorAll(".timer-mode-btn");

  // Grab individual stretch buttons on the dashboard settings panel
  const stretchActionBtns = document.querySelectorAll(".stretch-action-btn");

  // Initialize numerical timer state variables
  let workDurationMinutes = 25;
  let breakDurationMinutes = 5;
  let timeRemainingSeconds = workDurationMinutes * 60;
  let timerInterval = null;
  let isTimerRunning = false;
  let isWorkPhase = true;

  // Helper function to populate and show the custom alert modal
  function showAlertModal(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    customModal.classList.remove("hidden");
  }

  // Dismiss the custom modal when the confirmation button is clicked
  modalCloseBtn.addEventListener("click", function () {
    customModal.classList.add("hidden");
  });

  // Switch from signup view to login view and clear input values
  showLoginLink.addEventListener("click", function (event) {
    event.preventDefault();
    signupUsernameInput.value = "";
    signupPasswordInput.value = "";
    signupView.classList.add("hidden");
    loginView.classList.remove("hidden");
  });

  // Switch from login view back to signup view and clear input values
  showSignupLink.addEventListener("click", function (event) {
    event.preventDefault();
    loginUsernameInput.value = "";
    loginPasswordInput.value = "";
    loginView.classList.add("hidden");
    signupView.classList.remove("hidden");
  });

  // Handle account creation logic with validation for blanks, short passwords, and duplicates
  createAccountButton.addEventListener("click", function () {
    const username = signupUsernameInput.value.trim();
    const password = signupPasswordInput.value.trim();

    if (username === "" || password === "") {
      showAlertModal("Missing Information", "Please enter both a username and a password.");
      return;
    }

    if (password.length < 6) {
      showAlertModal("Password Too Short", "Please choose a password that is at least 6 characters long.");
      return;
    }

    const userKey = "ergoUser_" + username;
    if (localStorage.getItem(userKey)) {
      showAlertModal("Username Exists", "This username already exists. Please choose another one or log in.");
      return;
    }

    localStorage.setItem(userKey, password);
    localStorage.setItem("currentActiveUser", username);

    selectedSymptoms.clear();
    symptomCards.forEach(function (c) { c.classList.remove("selected"); });
    startWellnessButton.setAttribute("disabled", "true");
    startWellnessButton.classList.add("disabled-btn");

    signupView.classList.add("hidden");
    symptomsView.classList.remove("hidden");
  });

  // Validate login credentials and transition directly to the dashboard view
  loginButton.addEventListener("click", function () {
    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value.trim();

    if (username === "" || password === "") {
      showAlertModal("Login Error", "Please enter your username and password.");
      return;
    }

    const userKey = "ergoUser_" + username;
    const storedPassword = localStorage.getItem(userKey);

    // Save user credentials if logging in for the first time
    if (!storedPassword) {
      localStorage.setItem(userKey, password);
    }

    localStorage.setItem("currentActiveUser", username);

    // Transition directly to dashboard screen
    loginView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    loadUserStretchPreferences();
  });

  // Loop through symptom cards to toggle selection state and enable or disable continue button
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
        startWellnessButton.removeAttribute("disabled");
        startWellnessButton.classList.remove("disabled-btn");
      } else {
        startWellnessButton.setAttribute("disabled", "true");
        startWellnessButton.classList.add("disabled-btn");
      }
    });
  });

  // Save selected symptoms uniquely under the active username and persist toggle states
  startWellnessButton.addEventListener("click", function () {
    if (selectedSymptoms.size > 0) {
      const activeUser = localStorage.getItem("currentActiveUser") || "defaultUser";
      const symptomArray = Array.from(selectedSymptoms);
      localStorage.setItem("userSymptoms_" + activeUser, JSON.stringify(symptomArray));
      
      // Save initial toggle states so they persist across logouts
      Object.keys(preferenceMap).forEach(key => {
        const toggle = preferenceMap[key];
        if (toggle) {
          toggle.checked = symptomArray.includes(key);
        }
      });
      localStorage.setItem("userToggleStates_" + activeUser, JSON.stringify(getToggleStates(activeUser)));

      symptomsView.classList.add("hidden");
      dashboardView.classList.remove("hidden");
      loadUserStretchPreferences();
    }
  });

  // Helper to capture toggle checkbox states
  function getToggleStates(username) {
    const states = {};
    Object.keys(preferenceMap).forEach(key => {
      const toggle = preferenceMap[key];
      if (toggle) {
        states[key] = toggle.checked;
      }
    });
    return states;
  }

  // Retrieve active user's saved toggle preferences and synchronize dashboard switches
  function loadUserStretchPreferences() {
    const activeUser = localStorage.getItem("currentActiveUser") || "defaultUser";
    const savedStates = JSON.parse(localStorage.getItem("userToggleStates_" + activeUser));
    const savedSymptoms = JSON.parse(localStorage.getItem("userSymptoms_" + activeUser)) || [];

    Object.keys(preferenceMap).forEach(key => {
      const toggle = preferenceMap[key];
      if (toggle) {
        if (savedStates && savedStates[key] !== undefined) {
          toggle.checked = savedStates[key];
        } else {
          toggle.checked = savedSymptoms.includes(key);
        }
      }
    });
  }

  // Save toggle changes whenever a user toggles them on the dashboard
  Object.keys(preferenceMap).forEach(key => {
    const toggle = preferenceMap[key];
    if (toggle) {
      toggle.addEventListener("change", function () {
        const activeUser = localStorage.getItem("currentActiveUser") || "defaultUser";
        localStorage.setItem("userToggleStates_" + activeUser, JSON.stringify(getToggleStates(activeUser)));
      });
    }
  });

  // Clear authentication input boxes and return to login screen on logout
  logoutButton.addEventListener("click", function () {
    signupUsernameInput.value = "";
    signupPasswordInput.value = "";
    loginUsernameInput.value = "";
    loginPasswordInput.value = "";

    dashboardView.classList.add("hidden");
    loginView.classList.remove("hidden");
  });

  // Attach click listeners to individual stretch buttons to trigger stretching session modal popup
  stretchActionBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const stretchType = btn.getAttribute("data-stretch");
      showAlertModal("Stretching Session", `Starting your guided stretching session for ${stretchType}.`);
    });
  });

  // Calculate remaining minutes and seconds into a formatted digital mm:ss countdown clock string
  function updateTimerDisplay() {
    const minutes = Math.floor(timeRemainingSeconds / 60);
    const seconds = timeRemainingSeconds % 60;
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
    const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
    timerDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
  }

  // Start the countdown timer interval loop, decrementing seconds every second
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

  // Clear the active countdown interval loop to pause the timer
  function pauseTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
  }

  // Pause the timer, reset active phase to work mode, and restore initial duration values
  function resetTimer() {
    pauseTimer();
    isWorkPhase = true;
    timeRemainingSeconds = workDurationMinutes * 60;
    timerPhaseText.textContent = "Focus Phase";
    updateTimerDisplay();
  }

  // Hook up timer control buttons
  startTimerBtn.addEventListener("click", startTimer);
  pauseTimerBtn.addEventListener("click", pauseTimer);
  resetTimerBtn.addEventListener("click", resetTimer);

  // Update work and break durations and reset clock when preset mode buttons are clicked
  timerModeBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      timerModeBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");

      workDurationMinutes = parseInt(btn.getAttribute("data-work"), 10);
      breakDurationMinutes = parseInt(btn.getAttribute("data-break"), 10);
      resetTimer();
    });
  });

  // Render starting time immediately on script load
  updateTimerDisplay();
});