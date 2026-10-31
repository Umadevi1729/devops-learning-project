const status = document.querySelector("#status");
const checkButton = document.querySelector("#check-button");

function showStatus() {
  status.textContent = `The site is up. Checked at ${new Date().toLocaleTimeString()}.`;
}

checkButton.addEventListener("click", showStatus);
showStatus();
