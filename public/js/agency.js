document.querySelector("input[type='file']").onchange = function(){
    document.querySelector("input[type='file'] + label").textContent = this.files[0].name;
}