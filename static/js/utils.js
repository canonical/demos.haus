function updateStatuses() {
  let statusComponents = document.getElementsByClassName("status-id-1");
  Object.keys(statusComponents).map((_, i) => {
    let element = statusComponents[i];
    let status = element.getAttribute("data-status");
    if (status == "0") {
      element.innerHTML = '<div class="p-status-label--positive">Running</div>';
    } else if (status == "1") {
      element.innerHTML = '<div class="p-status-label--caution">Builing</div>';
    } else if (status == "2") {
      element.innerHTML = '<div class="p-status-label--negative">Failed</div>';
    }
  });
}
window.addEventListener("load", updateStatuses);

function enableButtons() {
  let positiveButtons = document.getElementsByClassName("p-button--positive");
  let negativeButtons = document.getElementsByClassName("p-button--negative");

  Object.keys(positiveButtons).map((_, i) => {
    let element = positiveButtons[i];
    let status = element.getAttribute("data-button-status");
    if (status != "0") {
      element.removeAttribute("disabled");
    }
  });

  Object.keys(negativeButtons).map((_, i) => {
    let element = negativeButtons[i];
    let status = element.getAttribute("data-button-status");
    if (status == "0") {
      element.removeAttribute("disabled");
    }
  });
}

window.addEventListener("load", enableButtons);

function updateState(state, pod) {
  fetch(`/update?state=${state}&pod=${pod}`);
}

function addSpinner() {
  let buttons = document.getElementsByClassName("js-processing-button");
  let hideClass = "u-hide";
  let processingClass = "is-processing";

  Object.keys(buttons).map((_, i) => {
    let button = buttons[i];
    let spinner = button.querySelector(".p-icon--spinner");
    let buttonLabel = button.querySelector("#button-label");
    let buttonRect = button.getBoundingClientRect();

    button.addEventListener("click", function () {
      button.style.width = buttonRect.width + "px";
      button.style.height = buttonRect.height + "px";
      button.disabled = true;

      button.classList.add(processingClass);
      spinner.classList.remove(hideClass);
      buttonLabel.classList.add(hideClass);

      // timeout to remove the spinner from the button
      setTimeout(function () {
        button.style.width = null;
        button.style.height = null;
        button.disabled = false;

        button.classList.remove(processingClass);
        spinner.classList.add(hideClass);
        buttonLabel.classList.remove(hideClass);
        location.reload();
      }, 6000);
    });
  });
}

window.addEventListener("load", addSpinner);
