const $fileField = document.querySelector("input[type='file']");
const $productCardsCards = document.querySelectorAll(".card");

if ($fileField != null) {
  $fileField.onchange = function () {
    document.querySelector(
      "input[type='file'] + label"
    ).textContent = this.files[0].name;
  };
}

if ($productCardsCards.length) {
  $productCardsCards.forEach((card) => {
    card.addEventListener("click", function () {
      window.location.pathname = `/techProducts/${this.id}/reviews`;
    });
  });
}
