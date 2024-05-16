$(document).ready(function () {
  let questions;
  let currentQuestionIndex = 0;
  let score = 0;
  let currentLevel;
  let prenom;
  let selectedNiveau;
  let selectedRubrique;

  // Fonction pour charger les options de sélection du quiz
  function loadQuizzSelection(searchTerm = "") {
    $.getJSON("json/selectiondequizz.json", function (data) {
      data = data.sort(() => Math.random() - 0.5);

      if (searchTerm) {
        data = data.filter((item) =>
          item.titre.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      let htmlContent = "";
      data.forEach(function (item, index) {
        let commonRadioName = "uniqueSelection";
        let cardHtml = `<div class="card">
                          <div class="card-body">
                            <h2 class="card-title">${item.titre}</h2>
                            <img src="${item.image}" class="card-img-top" alt="${item.titre}" />
                            <div class="card-input">`;

        item.levels.forEach(function (level, levelIndex) {
          let uniqueId = "radio" + index + "_" + levelIndex;
          cardHtml += `<div><input type="radio" name="${commonRadioName}" id="${uniqueId}" />
                       <label for="${uniqueId}">${level.name}</label></div>`;
        });

        cardHtml += `</div></div></div>`;
        htmlContent += cardHtml;
      });
      $("#container").html(`<div id="selection">${htmlContent}</div>`);
    });
  }

  // Ajout de la barre de recherche
  $("#search-input").on("input", function () {
    let searchTerm = $(this).val();
    loadQuizzSelection(searchTerm);
  });

  // Gestionnaire d'événement pour le changement de sélection des niveaux
  $("#container").on("change", "input[type='radio']", function () {
    selectedRubrique = $(this).closest(".card").find("h2").text();
    selectedNiveau = $(this).next("label").text();
    let selectedImage = $(this).closest(".card").find("img").attr("src");
    selectedImage = selectedImage.toLowerCase(); // Convertir en minuscule pour la compatibilité des images
    prenom = prompt("Veuillez saisir votre prénom:");
    if (prenom) {
      if (prenom.length > 12) {
        alert(
          "Votre prénom est trop long, veuillez saisir un prénom plus court"
        );
      } else {
        $("#search-input").hide();
        let recapHtml = `<div class="start-quizz">
        <p>${selectedRubrique} - Niveau ${selectedNiveau}</p>
        <p><span>${prenom}</span>, vous allez pouvoir démarrer ce Quizz !!!</p>
        <img src="${selectedImage}" alt="${selectedRubrique}" />
        <div class="btn-quizz">
        <button id="btn-start">Démarrer le Quizz</button>
        <button id="btn-return">Retour à l'accueil</button>
        </div>
        </div>`;
        $("#container").html(recapHtml);
        currentLevel = selectedNiveau.toLowerCase();
      }
    } else {
      alert("Veuillez saisir un prénom.");
    }
  });

  // Gestionnaire d'événement pour le retour à l'accueil
  $(document).on("click", "#btn-return", function () {
    location.reload();
  });

  // Gestionnaire d'événement pour démarrer le quiz
  $(document).on("click", "#btn-start", function () {
    let quizzName = $("#container")
      .find("img")
      .attr("src")
      .match(/([^\/]+)(?=\.\w+$)/)[0];
    startQuizz(quizzName);
  });

  function startQuizz(quizzName) {
    $.getJSON(`json/quizz${quizzName}.json`, function (data) {
      questions = data.quizz[currentLevel];
      if (!questions || questions.length === 0) {
        alert("Aucune question disponible pour ce niveau.");
        return;
      }
      questions = questions.sort(() => Math.random() - 0.5);
      loadQuestion(currentQuestionIndex);
    });
  }

  function loadQuestion(index) {
    if (index >= questions.length || !questions) {
      console.error(
        "Aucune question disponible à l'index demandé ou tableau de questions non chargé."
      );
      return;
    }
    let question = questions[index];
    let questionHtml = `
    <h2>${selectedRubrique} - Niveau ${selectedNiveau}</h2>
    <div class="question">Question ${currentQuestionIndex + 1} : <span>${
      question.question
    }</span></div>
    <div class="answers">`;

    question.propositions.forEach((proposition, index) => {
      questionHtml += `<div class="answer" id="answer${index}" draggable="true">${proposition}</div>`;
    });

    questionHtml += `</div>
                      <div id="drop-zone">Déposez votre réponse ici</div>
                      <button id="btn-next" disabled>Suivant</button>`;
    $("#container").html(questionHtml);

    $(".answer").draggable({
      revert: "invalid",
      start: function (event, ui) {
        $(this).addClass("dragging");
      },
      stop: function (event, ui) {
        $(this).removeClass("dragging");
      },
    });

    $("#drop-zone").droppable({
      accept: ".answer",
      drop: function (event, ui) {
        let isCorrect = ui.draggable.text() === question.réponse;
        if (isCorrect) {
          const audio = new Audio("sound/success.mp3");
          audio.volume = 0.5;
          audio.play();
          score++;
          $(this).css("background-color", "green");
          ui.draggable.css("background-color", "green");
          if (question.anecdote) {
            $(".question").append(
              `<div class="context">Anecdote : ${question.anecdote}</div>`
            );
          }
        } else {
          const audio = new Audio("sound/error.mp3");
          audio.volume = 0.5;
          audio.play();
          $(this).css("background-color", "red");
          $(`.answer:contains('${question.réponse}')`).css(
            "background-color",
            "green"
          );
        }
        $(".answer").draggable("disable");
        $("#btn-next").prop("disabled", false);
      },
    });
  }

  $(document).on("click", "#btn-next", function () {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      loadQuestion(currentQuestionIndex);
    } else {
      const audio = new Audio("sound/finish.mp3");
      audio.volume = 0.5;
      audio.play();
      let result;
      if (score >= 7) {
        result = "<p class='result'>Bravo tu as réussi le quizz !</p>";
      } else if (score >= 4) {
        result =
          "<p class='result'>Pas mal, tu peux encore améliorer ton score</p>";
      } else {
        result =
          "<p class='result'>Il va falloir réviser un peu plus pour la prochaine fois</p>";
      }
      $("#container").html(
        `<h2>${selectedRubrique} - Niveau ${selectedNiveau}</h2>
        <h3>Quizz terminé !!!</h3>
        <p class="finish"><span>${prenom}</span>, vous avez obtenu le score de <span>${score} / ${questions.length}<span></p> ${result} <button id='btn-return'>Accueil</button>`
      );
      score = 0;
      currentQuestionIndex = 0;
    }
  });

  // Charger les sélections du quizz à l'initialisation
  loadQuizzSelection();
});
