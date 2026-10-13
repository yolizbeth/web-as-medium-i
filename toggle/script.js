document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('colorButton');

    button.addEventListener('click', function () {
        const divs = document.querySelectorAll('.color-box');

        // 1. Toggles between color states
        divs.forEach(div => {
            div.classList.toggle('day');
            div.classList.toggle('night');
        });

        // 2. Picks a random color-box that isn't currently the button
        const others = [...divs].filter(div => div !== button); // others = all color-box that are not a button
        const target = others[Math.floor(Math.random() * others.length)]; // creates target that is based on a random integer in array

        // 3. Swap places with the target
        const placeholder = document.createElement('div'); // creates temporary variable between swaps
        button.replaceWith(placeholder);
        target.replaceWith(button);
        placeholder.replaceWith(target);

        button.focus({ preventScroll: true }); // will keep keyboard focus after the move
    });
});