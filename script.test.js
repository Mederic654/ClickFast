/** @jest-environment jsdom */

test("le clic incrémente le score après le premier clic", () => {
    document.body.innerHTML = `
      <div id="score">0</div>
      <div id="timer">5</div>
      <button id="button-clicker">Click me!</button>
      <button id="button-reset">Reset</button>
    `;

    const {
        partieEnCours
    } = require("./script.js");

    const $ = require('jquery');

    const bouton = document.getElementById("button-clicker");
    const score = document.getElementById("score");

    bouton.click(); // 1er clic : démarre la partie, ne compte pas de point
    expect(score.textContent).toBe("0");

    bouton.click(); // 2e clic : compte un point
    expect(score.textContent).toBe("1");
});