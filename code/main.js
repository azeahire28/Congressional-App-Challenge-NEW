// grabbing element references from the DOM
var usernameInput = document.getElementById("usernameInput");
var passwordInput = document.getElementById("passwordInput");
var createAccountButton = document.getElementById("createAccountButton");

var loginUsernameInput = document.getElementById("loginUsernameInput");
var loginPasswordInput = document.getElementById("loginPasswordInput");
var loginButton = document.getElementById("loginButton");

var signupScreen = document.getElementById("signupView");
var loginScreen = document.getElementById("loginView");
var symptomsScreen = document.getElementById("symptomsView");

var showLoginLink = document.getElementById("showLoginLink");
var showSignupLink = document.getElementById("showSignupLink");

var symptomCards = document.querySelectorAll(".symptom-card");
var startWellnessButton = document.getElementById("startWellnessButton");

var currentUser = "";
var isAuthenticated = false;
var selectedSymptoms = [];

// timer structure inspired by standard Pomodoro timer patterns
var timerLength = 1500; 
var timerInterval = null; 
var isTimerRunning = false; 
var breakCountNumber = 0; 

// helper function to check for forbidden characters using basic RegEx validation
function containsInvalidCharacters(str) {
  var invalidRegex = /[^a-zA-Z0-9_]/;
  return invalidRegex.test(str);
}

// handle account creation with error checks
// warning popup pattern inspired by standard Web API form validation
createAccountButton.addEventListener("click", function() {
  var enteredUsername = usernameInput.value.trim();
  var enteredPassword = passwordInput.value;

  // check if fields are empty
  if (enteredUsername === "" || enteredPassword === "") {
    console.log("Warning: Please fill in all required fields.");
    alert("Please fill in all required fields.");
    return;
  }

  // check if password is too short
  if (enteredPassword.length < 6) {
    console.log("Warning: Password is too short.");
    alert("Password must be at least 6 characters long.");
    return;
  }

  // check if username uses unacceptable characters
  if (containsInvalidCharacters(enteredUsername)) {
    console.log("Warning: Username contains unacceptable characters.");
    alert("Username can only contain letters, numbers, and underscores.");
    return;
  }

  // saving user info and moving to the symptoms selection screen
  currentUser = enteredUsername;
  isAuthenticated = true;
  console.log("Account successfully created for user: " + currentUser);
  
  signupScreen.classList.add("hidden");
  symptomsScreen.classList.remove("hidden");
});

// handle login click with basic validation and transition to symptoms screen
loginButton.addEventListener("click", function() {
  var inputUser = loginUsernameInput.value.trim();
  var inputPass = loginPasswordInput.value;

  if (inputUser === "" || inputPass === "") {
    console.log("Warning: Missing login credentials.");
    alert("Please enter both your username and password.");
    return;
  }

  currentUser = inputUser;
  isAuthenticated = true;
  console.log("User successfully logged in: " + currentUser);

  loginScreen.classList.add("hidden");
  symptomsScreen.classList.remove("hidden");
});

// handling symptom selection cards toggle logic
symptomCards.forEach(function(card) {
  card.addEventListener("click", function() {
    card.classList.toggle("selected");
    var symptomName = card.getAttribute("data-symptom");

    if (card.classList.contains("selected")) {
      selectedSymptoms.push(symptomName);
    } else {
      var index = selectedSymptoms.indexOf(symptomName);
      if (index > -1) {
        selectedSymptoms.splice(index, 1);
      }
    }

    // enabling continue button once at least one symptom is picked
    if (selectedSymptoms.length > 0) {
      startWellnessButton.classList.remove("disabled-btn");
      startWellnessButton.removeAttribute("disabled");
    } else {
      startWellnessButton.classList.add("disabled-btn");
      startWellnessButton.setAttribute("disabled", "true");
    }
  });
});

// handle starting the main wellness plan after symptom selection
startWellnessButton.addEventListener("click", function() {
  if (selectedSymptoms.length > 0) {
    console.log("User selected symptoms: " + selectedSymptoms.join(", "));
    alert("Wellness plan started! Transitioning to timer dashboard...");
    // Next screen (timer dashboard) will go here!
  }
});

// troubleshooting fix: view-switching structure inspired by Electron single-page app patterns
showLoginLink.addEventListener("click", function(event) {
  event.preventDefault();
  signupScreen.classList.add("hidden");
  loginScreen.classList.remove("hidden");
});

showSignupLink.addEventListener("click", function(event) {
  event.preventDefault();
  loginScreen.classList.add("hidden");
  signupScreen.classList.remove("hidden");
});