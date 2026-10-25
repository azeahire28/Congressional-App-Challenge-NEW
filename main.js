// Waiting for the full html doc to load before running any script logic
document.addEventListener("DOMContentLoaded", function () {
  // Grabs references to all main container views for dynamic screen switching
  const signupView = document.getElementById("signupView");
  const loginView = document.getElementById("loginView");
  const symptomsView = document.getElementById("symptomsView");
  const dashboardView = document.getElementById("dashboardView");

  // gets navigation triggers and buttons across authentication flows
  const showLoginLink = document.getElementById("showLoginLink");
  const showSignupLink = document.getElementById("showSignupLink");
  const createAccountButton = document.getElementById("createAccountButton");
  const loginButton = document.getElementById("loginButton");
  const logoutButton = document.getElementById("logoutButton");

  // Grabs input fields for signup and login forms
  const signupUsernameInput = document.getElementById("signupUsernameInput");
  const signupPasswordInput = document.getElementById("signupPasswordInput");
  const loginUsernameInput = document.getElementById("loginUsernameInput");
  const loginPasswordInput = document.getElementById("loginPasswordInput");

  // Grabs symptom cards, continue button, and tracking collection set
  const symptomCards = document.querySelectorAll(".symptom-card");
  const startWellnessButton = document.getElementById("startWellnessButton");
  const selectedSymptoms = new Set();

  // Grabs toggle elements on the dashboard settings panel mapped to their respective stretch categories
  const preferenceMap = {
    "Eye Strain": document.getElementById("stretchEyeToggle"),
    "Neck Tension": document.getElementById("stretchNeckToggle"),
    "Back & Posture": document.getElementById("stretchBackToggle"),
    "Wrist & Hand Tension": document.getElementById("stretchWristToggle"),
    "Hip Tightness": document.getElementById("stretchHipToggle"),
    "Tension Headaches": document.getElementById("stretchHeadacheToggle")
  };

  // Grabs custom modal elements for validation messages and stretch popups
  const customModal = document.getElementById("customModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const modalXBtn = document.getElementById("modalXBtn");

  // Grabs focus timer display elements, status text, and control buttons
  const timerDisplay = document.getElementById("timerDisplay");
  const timerPhaseText = document.getElementById("timerPhaseText");
  const startTimerBtn = document.getElementById("startTimerBtn");
  const pauseTimerBtn = document.getElementById("pauseTimerBtn");
  const resetTimerBtn = document.getElementById("resetTimerBtn");
  const timerModeBtns = document.querySelectorAll(".timer-mode-btn");

  // Grabs individual stretch buttons on the dashboard settings panel
  const stretchActionBtns = document.querySelectorAll(".stretch-action-btn");

  // Initializes numerical focus/break timer state variables
  let workDurationMinutes = 25;
  let breakDurationMinutes = 5;
  let timeRemainingSeconds = workDurationMinutes * 60;
  let timerInterval = null;
  let isTimerRunning = false;
  let isWorkPhase = true;
  let timerEndTime = null;

  // Populates and displays the generic custom alert modal with custom titles, messages, and button text
  function showAlertModal(title, message, buttonText = "Ok") {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    if (modalCloseBtn) {
      modalCloseBtn.textContent = buttonText;
    }
    customModal.classList.remove("hidden");
  }

  // Dismisses the custom modal when the default confirmation button is clicked by hiding the backdrop
  modalCloseBtn.addEventListener("click", function () {
    customModal.classList.add("hidden");
  });

  // Closes modal on X click, dismisses the popup, and stops any active intervals to resume normal flow
  modalXBtn.addEventListener("click", function () {
    customModal.classList.add("hidden");
    if (typeof stretchInterval !== 'undefined' && stretchInterval) {
      clearInterval(stretchInterval);
    }
  });

  // Switches from signup view to login view and clears input values so fields are fresh
  showLoginLink.addEventListener("click", function (event) {
    event.preventDefault();
    signupUsernameInput.value = "";
    signupPasswordInput.value = "";
    signupView.classList.add("hidden");
    loginView.classList.remove("hidden");
  });

  // Switches from login view back to signup view and clears input values
  showSignupLink.addEventListener("click", function (event) {
    event.preventDefault();
    loginUsernameInput.value = "";
    loginPasswordInput.value = "";
    loginView.classList.add("hidden");
    signupView.classList.remove("hidden");
  });

  // Handles account creation logic with validation for blank fields, short passwords, and existing duplicates
  createAccountButton.addEventListener("click", function () {
    const username = signupUsernameInput.value.trim();
    const password = signupPasswordInput.value.trim();

    // Checks if fields are empty
    if (username === "" || password === "") {
      showAlertModal("Missing Information", "Please enter both a username and a password.");
      return;
    }

    // Checks if password meets minimum length requirement
    if (password.length < 6) {
      showAlertModal("Password Too Short", "Please choose a password that is at least 6 characters long.");
      return;
    }

    // Checks if username already exists in local storage
    const userKey = "ergoUser_" + username;
    if (localStorage.getItem(userKey)) {
      showAlertModal("Username Exists", "This username already exists. Please choose another one or log in.");
      return;
    }

    // Saves new user credentials and sets active user session
    localStorage.setItem(userKey, password);
    localStorage.setItem("currentActiveUser", username);

    // Resets symptom selections for the new account
    selectedSymptoms.clear();
    symptomCards.forEach(function (c) {
      c.classList.remove("selected");
    });
    startWellnessButton.setAttribute("disabled", "true");
    startWellnessButton.classList.add("disabled-btn");

    // Transitions from signup view to the symptom selection view
    signupView.classList.add("hidden");
    symptomsView.classList.remove("hidden");
  });

  // Validates login credentials against local storage and transitions directly to the dashboard view
  loginButton.addEventListener("click", function () {
    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value.trim();

    // Checks for empty inputs
    if (username === "" || password === "") {
      showAlertModal("Login Error", "Please enter your username and password.");
      return;
    }

    const userKey = "ergoUser_" + username;
    const storedPassword = localStorage.getItem(userKey);

    // Verifies stored password or creates fallback entry
    if (!storedPassword) {
      localStorage.setItem(userKey, password);
    } else if (storedPassword !== password) {
      showAlertModal("Login Error", "Incorrect password.");
      return;
    }

    localStorage.setItem("currentActiveUser", username);

    // Transitions to dashboard and initializes user preferences and inactivity tracker
    loginView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    loadUserStretchPreferences();
    startInactivityTracker();
  });

  // Loops through symptom cards to toggle selection state and enable or disable the continue button
  symptomCards.forEach(function (card) {
    card.addEventListener("click", function () {
      const symptomKey = card.getAttribute("data-symptom");

      // Toggles visual and collection state based on click
      if (card.classList.contains("selected")) {
        card.classList.remove("selected");
        selectedSymptoms.delete(symptomKey);
      } else {
        card.classList.add("selected");
        selectedSymptoms.add(symptomKey);
      }

      // Enables or disables continue button depending on whether any symptoms are selected
      if (selectedSymptoms.size > 0) {
        startWellnessButton.removeAttribute("disabled");
        startWellnessButton.classList.remove("disabled-btn");
      } else {
        startWellnessButton.setAttribute("disabled", "true");
        startWellnessButton.classList.add("disabled-btn");
      }
    });
  });

  // Saves selected symptoms and initializes toggle states uniquely under the active username
  startWellnessButton.addEventListener("click", function () {
    if (selectedSymptoms.size > 0) {
      const activeUser = localStorage.getItem("currentActiveUser") || "defaultUser";
      const symptomArray = Array.from(selectedSymptoms);

      // Stores user symptoms and default toggle preferences in local storage
      localStorage.setItem("userSymptoms_" + activeUser, JSON.stringify(symptomArray));
      const initialStates = {};
      Object.keys(preferenceMap).forEach(key => {
        initialStates[key] = symptomArray.includes(key);
      });
      localStorage.setItem("userToggleStates_" + activeUser, JSON.stringify(initialStates));

      // Transitions from symptoms view into the main dashboard view
      symptomsView.classList.add("hidden");
      dashboardView.classList.remove("hidden");
      loadUserStretchPreferences();
      startInactivityTracker();
    }
  });

  // Captures current toggle checkbox states from dashboard switches
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

  // Retrieves active user's saved toggle preferences and synchronizes dashboard toggle switches
  function loadUserStretchPreferences() {
    const activeUser = localStorage.getItem("currentActiveUser") || "defaultUser";
    const savedStates = JSON.parse(localStorage.getItem("userToggleStates_" + activeUser));
    const savedSymptoms = JSON.parse(localStorage.getItem("userSymptoms_" + activeUser)) || [];
    let anyEnabled = false;

    Object.keys(preferenceMap).forEach(key => {
      const toggle = preferenceMap[key];
      if (toggle) {
        if (savedStates && savedStates[key] !== undefined) {
          toggle.checked = savedStates[key];
        } else {
          toggle.checked = savedSymptoms.includes(key);
        }
        if (toggle.checked) {
          anyEnabled = true;
        }
      }
    });

    // Warns the user upon entering the dashboard if no stretches are enabled, button says "Ok"
    if (!anyEnabled) {
      showAlertModal("No Stretches Enabled", "You have no stretches toggled on so we can't give you reminders to stretch!", "Ok");
    }
  }

  // Saves toggle changes automatically whenever a user interacts with switches on the dashboard
  Object.keys(preferenceMap).forEach(key => {
    const toggle = preferenceMap[key];
    if (toggle) {
      toggle.addEventListener("change", function () {
        const activeUser = localStorage.getItem("currentActiveUser") || "defaultUser";
        localStorage.setItem("userToggleStates_" + activeUser, JSON.stringify(getToggleStates(activeUser)));
      });
    }
  });

  // Clears authentication input boxes, stops timer/tracker, and returns to login screen on user logout
  logoutButton.addEventListener("click", function () {
    resetTimer();
    stopInactivityTracker();
    signupUsernameInput.value = "";
    signupPasswordInput.value = "";
    loginUsernameInput.value = "";
    loginPasswordInput.value = "";
    dashboardView.classList.add("hidden");
    loginView.classList.remove("hidden");
  });

  // Contains all stretch routines, titles, category badges, video paths, and descriptions
  const stretchRoutineData = [
    {
      category: "Eye Strain",
      title: "Eye Strain Stretch",
      videoSrc: "./assets/Eye Strain Stretch GIF.mp4",
      durationSeconds: 30,
      description: "Rest your eyes, blink rapidly, or look away into the distance to relieve digital fatigue."
    },
    {
      category: "Neck Tension",
      title: "Neck Tension Stretch",
      videoSrc: "./assets/Neck Tension Stretch GIF.mp4",
      durationSeconds: 30,
      description: "Gently tilt your ear toward your shoulder to release tightness in the upper traps and neck."
    },
    {
      category: "Back & Posture",
      title: "Seated Overhead Reach",
      videoSrc: "./assets/Seated Overhead Reach Stretch GIF.mp4",
      durationSeconds: 30,
      description: "Interlock your fingers and press your palms upward toward the ceiling, lengthening your spine."
    },
    {
      category: "Back & Posture",
      title: "Shoulder Roll",
      videoSrc: "./assets/Shoulder Roll Stretch GIF.mp4",
      durationSeconds: 30,
      description: "Roll your shoulders slowly upward, backward, and down to release built-up scapular tension."
    },
    {
      category: "Wrist & Hand Tension",
      title: "Wrist Flexor Stretch",
      videoSrc: "./assets/Wrist Flexor Stretch GIF.mp4",
      durationSeconds: 30,
      description: "Extend one arm forward with your palm facing out, gently pulling fingers back to stretch the forearm."
    },
    {
      category: "Wrist & Hand Tension",
      title: "Deltoid Stretch",
      videoSrc: "./assets/Deltoid Stretch GIF.mp4",
      durationSeconds: 30,
      description: "Pull your arm across your chest to stretch the shoulder and upper back muscles."
    },
    {
      category: "Hip Tightness",
      title: "Seated Figure-4 Stretch",
      videoSrc: "./assets/Seated Figure-4 Stretch GIF.mp4",
      durationSeconds: 30,
      description: "Cross one ankle over your opposite knee, sitting tall and applying light pressure to open the hip."
    },
    {
      category: "Tension Headaches",
      title: "Tension Headache Relief",
      videoSrc: "./assets/Tension Headache Stretch GIF.mp4",
      durationSeconds: 30,
      description: "Rest fingertips gently on your temples and move them in small, slow circles to release head pressure."
    }
  ];

  // Tracks active position in routine and countdown timers (using activeStretches array and routineIndex variable)
  let activeStretches = [];
  let routineIndex = 0;
  let stretchTimeRemaining = 30;
  let isRestingPhase = false;
  let stretchInterval = null;

  // Hooks up click listeners to all dashboard stretch action buttons to launch guided routines
  stretchActionBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const categoryName = btn.getAttribute("data-stretch");
      const filteredStretches = stretchRoutineData.filter(item => item.category === categoryName);
      if (filteredStretches.length > 0) {
        runSingleCategorySession(filteredStretches);
      }
    });
  });

  // Runs a targeted single-category stretching session inside the modal
  function runSingleCategorySession(categoryStretches) {
    let catIndex = 0;
    let timeRemaining = categoryStretches[catIndex].durationSeconds;
    if (modalCloseBtn) modalCloseBtn.style.display = "none";

    // Renders the current stretch card inside the modal dialog
    function renderCurrentCategoryStretch() {
      const stretch = categoryStretches[catIndex];
      modalTitle.textContent = stretch.title;
      modalMessage.innerHTML = `
        <div id="stretchContainer" style="display: flex; flex-direction: column; align-items: center; text-align: center;">
          <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #232331665; background-color: #dcfce7; padding: 4px 12px; border-radius: 9999px; margin-bottom: 8px;">${stretch.category}</span>
          <div id="stretchTimer" style="font-size: 30px; font-weight: 800; color: #111827; margin: 8px 0;">00:${timeRemaining < 10 ? "0" + timeRemaining : timeRemaining}</div>
          <div style="width: 100%; height: 180px; background-color: #f9fafb; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; margin: 8px 0; border: 1px solid #f3f4f6;">
            <video src="${stretch.videoSrc}" autoplay loop muted playsinline style="max-height: 100%; max-width: 100%; object-fit: contain; pointer-events: none;"></video>
          </div>
          <p style="color: #4b5563; font-size: 14px; background-color: #f9fafb; padding: 12px; border-radius: 12px; border: 1px solid #e5e7eb; margin-top: 8px;">${stretch.description}</p>
          <button id="categoryDoneBtn" class="primary-btn" style="margin-top: 12px; width: 100%;">Done!</button>
        </div>
      `;
      customModal.classList.remove("hidden");
      setTimeout(() => {
        const doneBtn = document.getElementById("categoryDoneBtn");
        if (doneBtn) {
          doneBtn.onclick = () => {
            customModal.classList.add("hidden");
            if (modalCloseBtn) modalCloseBtn.style.display = "block";
            if (typeof stretchInterval !== 'undefined' && stretchInterval) clearInterval(stretchInterval);
          };
        }
      }, 50);
    }

    if (typeof stretchInterval !== 'undefined' && stretchInterval) clearInterval(stretchInterval);

    // Starts countdown timer interval for the current stretch exercise
    stretchInterval = setInterval(() => {
      timeRemaining--;
      const timerEl = document.getElementById("stretchTimer");
      if (timerEl) {
        const formatted = timeRemaining < 10 ? "0" + timeRemaining : timeRemaining;
        timerEl.textContent = `00:${formatted}`;
      }
      if (timeRemaining <= 0) {
        clearInterval(stretchInterval);
        if (catIndex < categoryStretches.length - 1) {
          catIndex++;
          timeRemaining = categoryStretches[catIndex].durationSeconds;
          renderCurrentCategoryStretch();
        } else {
          customModal.classList.add("hidden");
          if (modalCloseBtn) modalCloseBtn.style.display = "block";
        }
      }
    }, 1000);

    renderCurrentCategoryStretch();
  }

  // Renders and runs active full-routine stretch cards inside the modal container (Filtered by active toggles in top-to-bottom order with 5-second alternating bursts for multi-exercise categories)
  function startStretchSession() {
    const activeUser = localStorage.getItem("currentActiveUser") || "defaultUser";
    const toggles = getToggleStates(activeUser);

    const categoryOrder = Object.keys(preferenceMap);
    activeStretches = [];

    categoryOrder.forEach(categoryName => {
      if (toggles[categoryName]) {
        const catStretches = stretchRoutineData.filter(item => item.category === categoryName);
        if (catStretches.length === 1) {
          activeStretches.push({
            category: catStretches[0].category,
            title: catStretches[0].title,
            videoSrc: catStretches[0].videoSrc,
            durationSeconds: 30,
            description: catStretches[0].description
          });
        } else if (catStretches.length >= 2) {
          // Multi-exercise categories: alternate back and forth in 5-second bursts (3 times each = 30s total)
          for (let i = 0; i < 3; i++) {
            activeStretches.push({
              category: catStretches[0].category,
              title: catStretches[0].title,
              videoSrc: catStretches[0].videoSrc,
              durationSeconds: 5,
              description: catStretches[0].description
            });
            activeStretches.push({
              category: catStretches[1].category,
              title: catStretches[1].title,
              videoSrc: catStretches[1].videoSrc,
              durationSeconds: 5,
              description: catStretches[1].description
            });
          }
        }
      }
    });

    if (activeStretches.length === 0) {
      showAlertModal("No Stretches Enabled", "Please turn on at least one stretch toggle to start a session.", "Ok");
      return;
    }

    if (routineIndex >= activeStretches.length) {
      routineIndex = 0;
    }

    const currentStretch = activeStretches[routineIndex];
    stretchTimeRemaining = currentStretch.durationSeconds;
    modalTitle.textContent = currentStretch.title;
    modalMessage.innerHTML = `
      <div id="stretchContainer" style="display: flex; flex-direction: column; align-items: center; text-align: center;">
        <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #232331665; background-color: #dcfce7; padding: 4px 12px; border-radius: 9999px; margin-bottom: 8px;">${currentStretch.category}</span>
        <div id="stretchTimer" style="font-size: 30px; font-weight: 800; color: #111827; margin: 8px 0;">00:${stretchTimeRemaining < 10 ? "0" + stretchTimeRemaining : stretchTimeRemaining}</div>
        <div style="width: 100%; height: 180px; background-color: #f9fafb; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; margin: 8px 0; border: 1px solid #f3f4f6;">
          <video src="${currentStretch.videoSrc}" autoplay loop muted playsinline style="max-height: 100%; max-width: 100%; object-fit: contain; pointer-events: none;"></video>
        </div>
        <p style="color: #4b5563; font-size: 14px; background-color: #f9fafb; padding: 12px; border-radius: 12px; border: 1px solid #e5e7eb; margin-top: 8px;">${currentStretch.description}</p>
      </div>
    `;
    customModal.classList.remove("hidden");
    if (stretchInterval) clearInterval(stretchInterval);

    stretchInterval = setInterval(() => {
      stretchTimeRemaining--;
      const timerElement = document.getElementById("stretchTimer");
      if (timerElement) {
        const formattedSecs = stretchTimeRemaining < 10 ? "0" + stretchTimeRemaining : stretchTimeRemaining;
        timerElement.textContent = `00:${formattedSecs}`;
      }
      if (stretchTimeRemaining <= 0) {
        clearInterval(stretchInterval);
        if (!isRestingPhase) {
          if (routineIndex < activeStretches.length - 1) {
            isRestingPhase = true;
            stretchTimeRemaining = 5;
            runTransitionScreen();
          } else {
            runFinishedScreen();
          }
        }
      }
    }, 1000);
  }

  // Handles the 5-second rest and transition screen between consecutive stretches
  function runTransitionScreen() {
    routineIndex++;
    const nextStretch = activeStretches[routineIndex];
    modalTitle.textContent = "Get Ready";
    modalMessage.innerHTML = `
      <div class="py-8 flex flex-col items-center text-center">
        <span class="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-3">Transition</span>
        <h3 class="text-xl font-bold text-gray-800 mb-1">Next Up:</h3>
        <p class="text-lg font-medium text-gray-600 mb-4">${nextStretch ? nextStretch.title : "Almost Done"}</p>
        <div id="stretchTimer" class="text-5xl font-extrabold text-blue-600 my-2">${stretchTimeRemaining}s</div>
        <p class="text-gray-400 text-xs mt-3">Reset your posture and take a breath.</p>
      </div>
    `;
    stretchInterval = setInterval(() => {
      stretchTimeRemaining--;
      const timerElement = document.getElementById("stretchTimer");
      if (timerElement) {
        timerElement.textContent = `${stretchTimeRemaining}s`;
      }
      if (stretchTimeRemaining <= 0) {
        clearInterval(stretchInterval);
        isRestingPhase = false;
        startStretchSession();
      }
    }, 1000);
  }

  // Renders the final completion success screen when all stretches are finished
  function runFinishedScreen() {
    routineIndex = 0; // Reset routineIndex back to start for the next cycle
    modalTitle.textContent = "Great Job!";
    modalMessage.innerHTML = `
      <div class="py-6 flex flex-col items-center text-center">
        <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">✓</div>
        <p class="text-gray-600 text-sm mb-6">You completed your full stretch session and refreshed your posture.</p>
        <button id="doneSessionBtn" class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all">Done!</button>
      </div>
    `;
    setTimeout(() => {
      const doneBtn = document.getElementById("doneSessionBtn");
      if (doneBtn) {
        doneBtn.addEventListener("click", () => {
          customModal.classList.add("hidden");
        });
      }
    }, 100);
  }

  // Calculates remaining minutes and seconds into a formatted digital mm:ss countdown clock string
  function updateTimerDisplay() {
    const minutes = Math.floor(timeRemainingSeconds / 60);
    const seconds = timeRemainingSeconds % 60;
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
    const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
    timerDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
  }

  // Starts the countdown timer interval loop using absolute target timestamps to prevent browser throttling
  function startTimer() {
    const activeUser = localStorage.getItem("currentActiveUser") || "defaultUser";
    const toggles = getToggleStates(activeUser);
    const anyEnabled = Object.values(toggles).some(val => val === true);

    if (!anyEnabled) {
      showAlertModal("Stretches Required", "You can't start a timer unless you have stretches on!", "Ok");
      return;
    }

    if (isTimerRunning) return;
    isTimerRunning = true;
    timerEndTime = Date.now() + (timeRemainingSeconds * 1000);

    timerInterval = setInterval(function () {
      const now = Date.now();
      const timeLeftMs = timerEndTime - now;
      timeRemainingSeconds = Math.max(0, Math.floor(timeLeftMs / 1000));

      if (timeRemainingSeconds > 0) {
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        isTimerRunning = false;

        // Handles transitions between work phase and stretch break phase
        if (isWorkPhase) {
          isWorkPhase = false;
          timeRemainingSeconds = breakDurationMinutes * 60;
          timerPhaseText.textContent = "Stretch Break Phase";
          showAlertModal("Time to Stretch!", "Take a quick break and perform your ergonomic stretches.", "Ok");
          startStretchSession();
        } else {
          isWorkPhase = true;
          timeRemainingSeconds = workDurationMinutes * 60;
          timerPhaseText.textContent = "Focus Phase";
          showAlertModal("Break Complete", "Ready to start your next focus session?", "Ok");
        }
        updateTimerDisplay();
        startTimer();
      }
    }, 1000);
  }

  // Clears the active countdown interval loop to pause the timer
  function pauseTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
  }

  // Pauses the timer, resets active phase to work mode, clears end timestamp, and restores initial duration values
  function resetTimer() {
    pauseTimer();
    isWorkPhase = true;
    timeRemainingSeconds = workDurationMinutes * 60;
    timerEndTime = null;
    timerPhaseText.textContent = "Focus Phase";
    updateTimerDisplay();
  }

  // Hooks up event listeners for timer control buttons
  startTimerBtn.addEventListener("click", startTimer);
  pauseTimerBtn.addEventListener("click", pauseTimer);
  resetTimerBtn.addEventListener("click", resetTimer);

  // Updates work and break durations and resets clock when preset mode buttons are clicked
  timerModeBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      timerModeBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      workDurationMinutes = parseInt(btn.getAttribute("data-work"), 10);
      breakDurationMinutes = parseInt(btn.getAttribute("data-break"), 10);
      resetTimer();
    });
  });

  // Safety listener for window close or refresh to stop and reset the active timer
  window.addEventListener("beforeunload", function () {
    resetTimer();
  });

  // DASHBOARD INACTIVITY & STRETCH REMINDER TRACKER LOGIC
  let inactivityTimer = null;
  let inactivityTimeout = 15 * 60 * 1000; // 15 minutes threshold

  // Starts listening for user activity or triggering 15-minute reminders if no stretches are enabled
  function startInactivityTracker() {
    stopInactivityTracker();
    window.addEventListener("mousemove", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);
    resetInactivityTimer();
  }

  // Cleans up inactivity event listeners and timers
  function stopInactivityTracker() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    window.removeEventListener("mousemove", resetInactivityTimer);
    window.removeEventListener("keydown", resetInactivityTimer);
  }

  // Resets the 15-minute reminder countdown whenever user activity is detected
  function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      const activeUser = localStorage.getItem("currentActiveUser") || "defaultUser";
      const toggles = getToggleStates(activeUser);
      const anyEnabled = Object.values(toggles).some(val => val === true);

      // Every 15 minutes: if no stretches are enabled, remind them; otherwise check for inactivity
      if (!anyEnabled) {
        showAlertModal("No Stretches Enabled", "You have no stretches toggled on so we can't give you reminders to stretch!", "Ok");
      } else {
        const modal = document.getElementById("customModal");
        if (modal) {
          document.getElementById("modalTitle").innerText = "Are you still there?";
          document.getElementById("modalMessage").innerText = "We noticed you've been inactive for a while. Let us know if you're still working!";
          if (modalCloseBtn) {
            modalCloseBtn.innerText = "Yes!";
            modalCloseBtn.style.display = "block";
          }
          modal.classList.remove("hidden");
        }
      }
      // Restart the interval loop for the next 15 minutes
      resetInactivityTimer();
    }, inactivityTimeout);
  }

  // Renders starting time immediately on initial script load
  updateTimerDisplay();
});