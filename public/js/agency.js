const $fileField = document.querySelector("input[type='file']");
const $campCards = document.querySelectorAll(".card");

if ($fileField != null) {
  $fileField.onchange = function () {
    document.querySelector(
      "input[type='file'] + label"
    ).textContent = this.files[0].name;
  };
}

if ($campCards.length) {
  $campCards.forEach((card) => {
    card.addEventListener("click", function () {
      window.location.pathname = `/campgrounds/${this.id}/comments`;
    });
  });
}
