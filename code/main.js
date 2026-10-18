// Wait for the entire HTML document to be fully parsed and loaded before running any script logic
document.addEventListener("DOMContentLoaded", function () {

  // Query and store references to the primary application container views so we can switch between screens dynamically
  const authContainer = document.getElementById("authContainer");
  const centeredLoginContainer = document.getElementById("centeredLoginContainer");
  const symptomsView = document.getElementById("symptomsView");
  const dashboardView = document.getElementById("dashboardView");

  // Query and store references to the navigation buttons and action triggers used throughout the application flows
  const switchToLogin = document.getElementById("switchToLogin");
  const switchToSignup = document.getElementById("switchToSignup");
  const createAccountBtn = document.getElementById("createAccountBtn");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // Query and store references to the text and password input fields found inside the authentication forms
  const signupUsername = document.getElementById("signupUsername");
  const signupPassword = document.getElementById("signupPassword");
  const loginUsername = document.getElementById("loginUsername");
  const loginPassword = document.getElementById("loginPassword");

  // Query and store references to the symptom selection cards, instruction text, and tracking collection
  const symptomCards = document.querySelectorAll(".symptom-card");
  const symptomCountText = document.getElementById("symptomCountText");
  const symptomsContinueBtn = document.getElementById("symptomsContinueBtn");
  const selectedSymptoms = new Set();

  // Query and store references to the custom popup modal elements used for displaying validation errors and alerts
  const customModal = document.getElementById("customModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalCloseBtn = document.getElementById("modalCloseBtn");

  // Query and store references to the focus timer readout display, phase description text, and control buttons
  const timerDisplay = document.getElementById("timerDisplay");
  const timerPhaseText = document.getElementById("timerPhaseText");
  const startTimerBtn = document.getElementById("startTimerBtn");
  const pauseTimerBtn = document.getElementById("pauseTimerBtn");
  const resetTimerBtn = document.getElementById("resetTimerBtn");
  const timerModeBtns = document.querySelectorAll(".timer-mode-btn");

  // Initialize the numerical variables that control the countdown duration and operational state of the focus timer
  let workDurationMinutes = 25;
  let breakDurationMinutes = 5;
  let timeRemainingSeconds = workDurationMinutes * 60;
  let timerInterval = null;
  let isTimerRunning = false;
  let isWorkPhase = true;

  // Define a reusable helper function that populates the custom modal with a title and message before making it visible on screen
  function showAlertModal(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    customModal.classList.remove("hidden");
  }

  // Attach an event listener to hide the custom modal popup container when the close confirmation button is clicked
  modalCloseBtn.addEventListener("click", function () {
    customModal.classList.add("hidden");
  });

  // Attach an event listener to transition the user interface from the split sign-up screen to the centered login view
  switchToLogin.addEventListener("click", function (event) {
    event.preventDefault();
    authContainer.classList.add("hidden");
    centeredLoginContainer.classList.remove("hidden");
  });

  // Attach an event listener to transition the user interface back from the centered login view to the sign-up screen
  switchToSignup.addEventListener("click", function (event) {
    event.preventDefault();
    centeredLoginContainer.classList.add("hidden");
    authContainer.classList.remove("hidden");
  });

  // Attach an event listener to handle account creation, checking for empty inputs, duplicate usernames, and password length
  createAccountBtn.addEventListener("click", function () {
    const username = signupUsername.value.trim();
    const password = signupPassword.value.trim();

    // Check if the user left either the username or password fields empty, and display an error modal if true
    if (username === "" || password === "") {
      showAlertModal("Missing Information", "Please enter both a username and a password.");
      return;
    }

    // Check if the entered password is shorter than six characters, and display a warning modal if true
    if (password.length < 6) {
      showAlertModal("Password Too Short", "Please choose a password that is at least 6 characters long.");
      return;
    }

    // Check if a record with this specific username already exists inside browser storage to prevent account overwriting
    const userKey = "ergoUser_" + username;
    if (localStorage.getItem(userKey)) {
      showAlertModal("Username Exists", "This username already exists. Please choose another one or log in.");
      return;
    }

    // Save the new user credentials and active username session state into local storage
    localStorage.setItem(userKey, password);
    localStorage.setItem("currentActiveUser", username);

    // Clear any leftover symptom selections from prior sessions so the new account starts with a fresh setup screen
    selectedSymptoms.clear();
    symptomCards.forEach(function (c) { c.classList.remove("selected"); });
    symptomsContinueBtn.setAttribute("disabled", "true");
    symptomsContinueBtn.classList.add("disabled-btn");
    symptomCountText.textContent = "Please select at least 1 symptom to continue.";

    // Hide the sign-up view and reveal the personalized symptom setup screen
    authContainer.classList.add("hidden");
    symptomsView.classList.remove("hidden");
  });

  // Attach an event listener to validate login credentials and transition the user directly to their main dashboard view
  loginBtn.addEventListener("click", function () {
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();

    // Check if the login input fields are empty and display a warning message if they are
    if (username === "" || password === "") {
      showAlertModal("Login Error", "Please enter your username and password.");
      return;
    }

    // Store the active logged-in username so the dashboard can load the correct personalized preferences
    localStorage.setItem("currentActiveUser", username);

    // Hide the login screen container and display the main dashboard view, then load user preferences
    centeredLoginContainer.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    loadUserStretchPreferences();
  });

  // Loop through every selectable symptom card to attach a click listener that toggles its active selected state
  symptomCards.forEach(function (card) {
    card.addEventListener("click", function () {
      const symptomKey = card.getAttribute("data-symptom");

      // Toggle the visual selection class on the card and add or remove its identifier from our tracking collection set
      if (card.classList.contains("selected")) {
        card.classList.remove("selected");
        selectedSymptoms.delete(symptomKey);
      } else {
        card.classList.add("selected");
        selectedSymptoms.add(symptomKey);
      }

      // Update the instruction counter text and enable or disable the continue button depending on selection count
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

  // Attach an event listener to save the user's selected symptoms uniquely under their account and proceed to the dashboard view
  symptomsContinueBtn.addEventListener("click", function () {
    if (selectedSymptoms.size > 0) {
      const activeUser = localStorage.getItem("currentActiveUser") || "defaultUser";
      // Save the selected symptoms array into local storage using a unique key tied directly to the active username
      localStorage.setItem("userSymptoms_" + activeUser, JSON.stringify(Array.from(selectedSymptoms)));
      
      // Hide the symptom selection screen and reveal the dashboard container view
      symptomsView.classList.add("hidden");
      dashboardView.classList.remove("hidden");
      loadUserStretchPreferences();
    }
  });

  // Define a function that retrieves the active user's saved symptoms and automatically synchronizes the dashboard toggle switches
  function loadUserStretchPreferences() {
    const activeUser = localStorage.getItem("currentActiveUser") || "defaultUser";
    const savedSymptoms = JSON.parse(localStorage.getItem("userSymptoms_" + activeUser)) || [];

    // Map each symptom data identifier string to its corresponding physical checkbox input element on the dashboard settings panel
    const preferenceMap = {
      "eyes": document.getElementById("stretchEyeToggle"),
      "neck": document.getElementById("stretchNeckToggle"),
      "back": document.getElementById("stretchBackToggle"),
      "wrist": document.getElementById("stretchWristToggle"),
      "hip": document.getElementById("stretchHipToggle"),
      "headache": document.getElementById("stretchHeadacheToggle")
    };

    // Iterate through the preference map keys and set each toggle's checked property to true if it exists in the saved array
    Object.keys(preferenceMap).forEach(key => {
      const toggle = preferenceMap[key];
      if (toggle) {
        toggle.checked = savedSymptoms.includes(key);
      }
    });
  }

  // Attach an event listener to the dashboard logout button to clear form inputs and return the interface to the login view
  logoutBtn.addEventListener("click", function () {
    signupUsername.value = "";
    signupPassword.value = "";
    loginUsername.value = "";
    loginPassword.value = "";

    dashboardView.classList.add("hidden");
    centeredLoginContainer.classList.remove("hidden");
  });

  // Define a function to calculate remaining minutes and seconds, formatting them into a readable mm:ss string for the timer display
  function updateTimerDisplay() {
    const minutes = Math.floor(timeRemainingSeconds / 60);
    const seconds = timeRemainingSeconds % 60;
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
    const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
    timerDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
  }

  // Define a function that starts the countdown interval loop, decrementing remaining seconds every second until zero
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
        
        // Toggle between the work focus phase and the stretch break phase when the countdown timer reaches zero
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

  // Define a function that clears the active countdown interval and halts timer execution
  function pauseTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
  }

  // Define a function that pauses the timer, resets the active phase back to work mode, and restores initial duration values
  function resetTimer() {
    pauseTimer();
    isWorkPhase = true;
    timeRemainingSeconds = workDurationMinutes * 60;
    timerPhaseText.textContent = "Focus Phase";
    updateTimerDisplay();
  }

  // Attach click event listeners to the timer control buttons for starting, pausing, and resetting the countdown
  startTimerBtn.addEventListener("click", startTimer);
  pauseTimerBtn.addEventListener("click", pauseTimer);
  resetTimerBtn.addEventListener("click", resetTimer);

  // Loop through all timer mode preset buttons to add event listeners that update work and break durations upon selection
  timerModeBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      timerModeBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");

      workDurationMinutes = parseInt(btn.getAttribute("data-work"), 10);
      breakDurationMinutes = parseInt(btn.getAttribute("data-break"), 10);
      resetTimer();
    });
  });

  // Call the timer display formatting function immediately on script load to render the default initial state on screen
  updateTimerDisplay();
});