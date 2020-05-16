const $fileField = document.querySelector("input[type='file']");
const $productCards = document.querySelectorAll(".techProduct-card-col .card");
const $revealPassBtns = document.querySelectorAll(".input-group-append > a");

function showTypedPassword() {
  $revealPassBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const $passwordField = this.parentNode.parentNode.querySelector(
          ".input-group > input"
        ),
        $passwordIcon = this.querySelector("i");
      if ($passwordField.getAttribute("type") === "text") {
        $passwordField.setAttribute("type", "password");
        $passwordIcon.classList.add("fa-eye-slash");
        $passwordIcon.classList.remove("fa-eye");
      } else {
        $passwordIcon.classList.remove("fa-eye-slash");
        $passwordIcon.classList.add("fa-eye");
        $passwordField.setAttribute("type", "text");
      }
    });
  });
}

function showFileName() {
  $fileField.onchange = function () {
    document.querySelector(
      "input[type='file'] + label"
    ).textContent = this.files[0].name;
  };
}

function redirectOnCardClick() {
  $productCards.forEach((card) => {
    card.addEventListener("click", function () {
      window.location.pathname = `/techProducts/${this.id}/reviews`;
    });
  });
}

if ($fileField != null) {
  showFileName();
}

if ($productCards.length) {
  redirectOnCardClick();
}

if ($revealPassBtns.length) {
  showTypedPassword();
}
