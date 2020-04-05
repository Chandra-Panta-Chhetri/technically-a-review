const $revealPassBtns = document.querySelectorAll(".input-group-append > a");

$revealPassBtns.forEach((btn) => {
    btn.addEventListener('click', function () {
        const $passwordField = this.parentNode.parentNode.querySelector(".input-group > input"),
              $passwordIcon  = this.querySelector('i');
        if($passwordField.getAttribute('type') === 'text'){
            $passwordField.setAttribute('type', 'password');
            $passwordIcon.classList.add('fa-eye-slash');
            $passwordIcon.classList.remove('fa-eye');
        }else{
            $passwordIcon.classList.remove('fa-eye-slash');
            $passwordIcon.classList.add('fa-eye');
            $passwordField.setAttribute('type', 'text');
        }
    });
});