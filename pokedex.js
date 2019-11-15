/**
 * Name: Seungyun Shin
 * Date: 11/7/2019
 * Section/TA: CSE 154/Andrew
 * This is the JS file for Homework 3(pokedex), I will implement views for a Pokedex and
 * two Pokemon cards. In this hw, I learned how to use JavaScript fetch API correctly.
 */
"use strict";
(function() {
  const FIR_FOUNDS = ["charmander", "bulbasaur", "squirtle"];
  const URL_BASE = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/";
  const URL_POKE = URL_BASE + "pokedex.php";
  const URL_GAME = URL_BASE + "game.php";
  const HP_LIMIT = 0.2;
  let guid = "";
  let pid = "";
  let fullHp = 0;

  window.addEventListener("load", init);

  /**
   * When the window loads, get all of the recipe buttons and set them up
   * to show their recipes when clicked.
   */
  function init() {
    let query1 = URL_POKE + "?pokedex=all";
    fetch(query1)
      .then(checkStatus)
      .then((resp) => resp.text())
      .then(makeSprites)
      .catch(console.error);
    id("start-btn").addEventListener("click", startGame);
    id("flee-btn").addEventListener("click", resultMove);
    id("endgame").addEventListener("click", goBack);
  }

  /**
   * make the pokedex view by fetching their sprites from the web
   * @param {object} response - the response JSON object
   */
  function makeSprites(response) {
    let pokedexs = response.split("\n");
    let mainview = id("pokedex-view");
    for (let i = 0; i < pokedexs.length; i++) {
      let name = pokedexs[i].split(":")[1];
      let source = URL_BASE + "sprites/" + name + ".png";
      let sprites = gen("img");
      sprites.id = name;
      sprites.src = source;
      sprites.classList.add("sprite");
      sprites.alt = name + " img";
      if (name === FIR_FOUNDS[0] || name === FIR_FOUNDS[1] || name === FIR_FOUNDS[2]) {
        sprites.classList.add("found");
      }
      mainview.appendChild(sprites);
    }
    let founditems = qsa(".found");
    for (let j = 0; j < founditems.length; j++) {
      founditems[j].addEventListener("click", afterClick);
    }
  }

  /**
   * When pokemon (.found) is clicked, fetch the information from api.
   */
  function afterClick() {
    let nameOfcard = this.id;
    id("start-btn").classList.remove("hidden");
    qs("#p1 .name").id = nameOfcard;
    let getinfo = URL_POKE + "?pokemon=" + nameOfcard;
    fetch(getinfo)
      .then(checkStatus)
      .then((resp) => resp.json())
      .then((resp) => getCard(resp, "#p1"))
      .catch(console.error);
  }

  /**
   * Fetch the  pokemon's info into the card-view of the player.
   * @param {object} resp - the response JSON object from fetch request
   * @param {object} player - the player of the card
   */
  function getCard(resp, player) {
    if (player === "#p1") {
      fullHp = resp.hp;
    }
    qs(player + " .name").innerText = resp.name;
    qs(player + " .type").src = URL_BASE + resp.images.typeIcon;
    qs(player + " .hp").innerText = resp.hp + "HP";
    qs(player + " .pokepic").src = URL_BASE + resp.images.photo;
    qs(player + " .info").innerText = resp.info.description;
    qs(player + " .weakness").src = URL_BASE + resp.images.weaknessIcon;
    getMoves(resp, player);
  }

  /**
   * Fetch the pokemon's move info into the card-view of the player.
   * @param {object} resp - the response JSON object from fetch request
   * @param {object} player - the player of the card
   */
  function getMoves(resp, player) {
    let moveBtns = qsa(player + " .moves button");
    let moveImgs = qsa(player + " .moves img");
    let moveNames = qsa(player + " .moves .move");
    let moveDps = qsa(player + " .moves .dp");
    for (let i = 0; i < moveBtns.length; i++) {
      if (resp.moves[i] !== undefined) {
        if (player === "#p1") {
          moveBtns[i].addEventListener("click", resultMove);
        }
        moveBtns[i].classList.remove("hidden");
        moveNames[i].textContent = resp.moves[i].name;
        moveImgs[i].src = URL_BASE + "icons/" + resp.moves[i].type + ".jpg";
        if (resp.moves[i].dp !== undefined) {
          moveDps[i].textContent = resp.moves[i].dp + " DP";
        } else {
          moveDps[i].textContent = " ";
        }
      } else {
        moveBtns[i].classList.add("hidden");
      }
    }
  }

  /**
   *  when a move(button) is clicked, that move proceeds. Sent a request to the server by
   *  using POST and update.
   */
  function resultMove() {
    id("p1-turn-results").innerText = "";
    id("p2-turn-results").innerText = "";
    id("loading").classList.remove("hidden");

    let params = new FormData();
    params.append("guid", guid);
    params.append("pid", pid);
    if (this.id === "flee-btn") {
      params.append("movename", "flee");
    } else {
      params.append("movename", this.querySelector("span").textContent);
    }
    fetch(URL_GAME, {method: "POST", body: params})
      .then(checkStatus)
      .then((resp) => resp.json())
      .then(afterAttack)
      .catch(console.error);
  }

  /**
   * When game started, the page is changed correctly.(ex. buttons showing)
   * Sent request to the server to get player 2's info and make card for p2.
   */
  function startGame() {
    id("pokedex-view").classList.add("hidden");
    id("p2").classList.remove("hidden");
    qs("#p1 .hp-info").classList.remove("hidden");
    id("results-container").classList.remove("hidden");
    id("flee-btn").classList.remove("hidden");
    id("start-btn").classList.add("hidden");
    qs("#p1 .buffs").classList.remove("hidden");
    let moves = qsa("#p1 button");
    for (let i = 0; i < moves.length; i++) {
      moves[i].disabled = false;
    }

    let params = new FormData();
    params.append("startgame", "true");
    params.append("mypokemon", qs("#p1 .name").id);
    fetch(URL_GAME, {method: "POST", body: params})
      .then(checkStatus)
      .then((resp) => resp.json())
      .then(getGUPI)
      .catch(console.error);

    id("p1-turn-results").classList.remove("hidden");
    id("p2-turn-results").classList.remove("hidden");
    qs("#p1 .buffs").classList.remove("hidden");
    qs("#p2 .buffs").classList.remove("hidden");

  }

  /**
   * helper function for startGame
   * @param {object} resp - the response JSON object from fetch request to fetch info of
   * game id(guid) and play id(pid) and get info for player 2's card.
   */
  function getGUPI(resp) {
    guid = resp.guid;
    pid = resp.pid;
    getCard(resp.p2, "#p2");
  }

  /**
   * Use the response information to display the result of this attack on the page using the
   * given response. If the game has ended
   * (one pokemon dies), update the page and buttons accordingly.
   * @param {object} resp - the response JSON object from fetch request to fetch info of
   * p1's attack(move)
   */
  function afterAttack(resp) {
    id("loading").classList.add("hidden");
    let p1HP = hpUpdate("p1", resp);
    let p2HP = hpUpdate("p2", resp);

    if (p1HP === 0 || p2HP === 0) {
      if (p1HP === 0) {
        qs("h1").textContent = "You lost!";
      } else {
        id(resp.p2["shortname"]).classList.add("found");
        id(resp.p2["shortname"]).addEventListener("click", afterClick);
        qs("h1").textContent = "You win!";
      }
      let buttons = qsa("#p1 .card button");
      for (let i = 0; i < buttons.length; i++) {
        buttons[i].disabled = true;
      }
      id("flee-btn").classList.add("hidden");
      id("endgame").classList.remove("hidden");
    }
  }

  /**
   * helper function of displayAttack
   * buff result and the message.
   * @param {String} player - the player of info
   * @param {object} resp - the response JSON object from fetch call
   * @return {number} hpNow - players current hp
   */
  function hpUpdate(player, resp) {
    qs("#" + player + " .hp").innerText = resp[player]["current-hp"] + "HP";
    attackResult(player, resp);
    let hpNow = resp[player]["current-hp"];
    return hpNow;
  }

  /**
   * Use the response information to display the result of this attack, update the health bar,
   * buff result and the message.
   * @param {String} player - the player who get attack-Result
   * @param {object} resp - the response JSON object from fetch call
   */
  function attackResult(player, resp) {
    let hpLeft = resp[player]["current-hp"] / resp[player]["hp"];
    qs("#" + player + " .health-bar").style.width = (hpLeft * 100) + "%";
    if (hpLeft <= HP_LIMIT) {
      qs("#" + player + " .health-bar").classList.add("low-health");
    }
    buffUpdate(player, resp);
    if (player === "p1" || (resp["results"][player + "-move"] !== null &&
        resp[player]["current-hp"] !== 0)) {
      let playerNum = player[1];
      id(player + "-turn-results").innerText = "Player " + playerNum + " played " +
        resp["results"][player + "-move"] + " and " + resp["results"][player + "-result"] + "!";
    } else {
      id(player + "-turn-results").innerText = "";
    }
  }

  /**
   * Use the response and update the buff and debuff icon by cards
   * @param {String} player - the player who get attack-Result
   * @param {object} resp - the response JSON object from fetch call
   */
  function buffUpdate(player, resp) {
    let allbuffs = qs("#" + player + " .buffs");
    allbuffs.innerHTML = "";
    helperBuff(player, resp, "buffs", allbuffs);
    helperBuff(player, resp, "debuffs", allbuffs);
  }

  /**
   * helper function for buffUpdate
   * @param {String} player - the player associated with the given information
   * @param {object} resp - the response JSON object
   * @param {String} typeofBuff - buff or debuff
   * @param {object} buffview - the view of buff showing
   */
  function helperBuff(player, resp, typeofBuff, buffview) {
    if (resp[typeofBuff] !== null) {
      for (let i = 0; i < resp[player][typeofBuff].length; i++) {
        let newBuff = gen("div");
        newBuff.classList.add("buff");
        newBuff.classList.add(resp[player][typeofBuff][i]);
        buffview.appendChild(newBuff);
      }
    }
  }

  /**
   * When "Back to Pokedex" button is clicked, end the battle and reset the page.
   */
  function goBack() {
    qs("h1").textContent = "Your Pokedex";
    id("pokedex-view").classList.remove("hidden");
    id("results-container").classList.add("hidden");
    id("p2").classList.add("hidden");
    id("endgame").classList.add("hidden");
    id("start-btn").classList.remove("hidden");
    qs("#p1 .buffs").classList.remove("hidden");
    qs("#p1 .buffs").innerHTML = "";
    id("p1-turn-results").innerText = "";
    id("p2-turn-results").innerText = "";
    qs("#p1 .hp-info").classList.add("hidden");
    let healthbars = qsa(".health-bar");
    for (let i = 0; i < healthbars.length; i++) {
      healthbars[i].style.width = "100%";
      healthbars[i].classList.remove("low-health");
    }
    qs("#p1 .hp").innerText = fullHp + "HP";
  }

  /**
   * Helper function to return the response's result text if successful, otherwise
   * returns the rejected Promise result with an error status and corresponding text
   * @param {object} response - response to check for success/error
   * @return {object} - valid response if response was successful, otherwise rejected
   *                    Promise result
   */
  function checkStatus(response) {
    if (!response.ok) {
      throw Error("Error in request: " + response.statusText);
    }
    return response; // a Response object
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} id - element ID
   * @return {object} DOM object associated with id.
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * Returns the first element that matches the given CSS selector.
   * @param {string} query - CSS query selector.
   * @returns {object[]} array of DOM objects matching the query.
   */
  function qs(query) {
    return document.querySelector(query);
  }

  /**
   * Returns the array of elements that match the given CSS selector.
   * @param {string} query - CSS query selector
   * @returns {object[]} array of DOM objects matching the query.
   */
  function qsa(query) {
    return document.querySelectorAll(query);
  }

  /**
   * Returns a new DOM element with the given tag name (if one exists). If el is not
   * a correct tag name, returns undefined.
   * @param {string} el - tag name
   * @return {object} newly-created DOM object of given tag type
   */
  function gen(el) {
    return document.createElement(el);
  }

})();
