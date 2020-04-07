const $fileField = document.querySelector("input[type='file']");

$fileField.onchange = function () {
	document.querySelector("input[type='file'] + label").textContent = this.files[0].name;
};
