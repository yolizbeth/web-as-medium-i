document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('colorButton');

    button.addEventListener('click', function() {
        // Selects all elements with the 'color-box' class
        const divs = document.querySelectorAll('.color-box');
        
        // Loop through each div and toggle both state classes
        divs.forEach(div => {
            div.classList.toggle('day');
            div.classList.toggle('night');
        });
    });
});