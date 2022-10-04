const playPanel = document.getElementById("playPanel");
const countPanel = document.getElementById("countPanel");
const scorePanel = document.getElementById("scorePanel");
const gameTime = 120;
let hinted = false;
let problems = [];
let problemCandidate;
let answerKanji = "漢字";
let answerYomis = ["かんじ"];
let englishVoices = [];
let correctCount = problemCount = 0;
const canvasCache = document.createElement("canvas").getContext("2d");
let endAudio, correctAudio, keyboardAudio;
loadAudios();
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
loadConfig();

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.dataset.theme = "dark";
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    delete document.documentElement.dataset.theme;
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.dataset.theme = "dark";
  }
}

function playAudio(audioBuffer, volume) {
  const audioSource = audioContext.createBufferSource();
  audioSource.buffer = audioBuffer;
  if (volume) {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(audioContext.destination);
    audioSource.connect(gainNode);
    audioSource.start();
  } else {
    audioSource.connect(audioContext.destination);
    audioSource.start();
  }
}

function unlockAudio() {
  audioContext.resume();
}

function loadAudio(url) {
  return fetch(url)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => {
      return new Promise((resolve, reject) => {
        audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
          resolve(audioBuffer);
        }, (err) => {
          reject(err);
        });
      });
    });
}

function loadAudios() {
  promises = [
    loadAudio("mp3/end.mp3"),
    loadAudio("mp3/correct3.mp3"),
    loadAudio("mp3/keyboard.mp3"),
  ];
  Promise.all(promises).then((audioBuffers) => {
    endAudio = audioBuffers[0];
    correctAudio = audioBuffers[1];
    keyboardAudio = audioBuffers[2];
  });
}

function loadVoices() {
  // https://stackoverflow.com/questions/21513706/
  const allVoicesObtained = new Promise(function (resolve) {
    let voices = speechSynthesis.getVoices();
    if (voices.length !== 0) {
      resolve(voices);
    } else {
      let supported = false;
      speechSynthesis.addEventListener("voiceschanged", () => {
        supported = true;
        voices = speechSynthesis.getVoices();
        resolve(voices);
      });
      setTimeout(() => {
        if (!supported) {
          document.getElementById("noTTS").classList.remove("d-none");
        }
      }, 1000);
    }
  });
  allVoicesObtained.then((voices) => {
    englishVoices = voices.filter((voice) => voice.lang == "ja-JP");
  });
}
loadVoices();

function speak(text) {
  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.voice = englishVoices[Math.floor(Math.random() * englishVoices.length)];
  msg.lang = "ja-JP";
  speechSynthesis.speak(msg);
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

function hideAnswer() {
  document.getElementById("answer").classList.add("d-none");
}

function showAnswer() {
  hinted = true;
  document.getElementById("answer").classList.remove("d-none");
  speak(answerYomis.join(", "));
}

function nextProblem() {
  hinted = false;
  problemCount += 1;
  if (problemCandidate.length <= 0) {
    problemCandidate = problems.slice();
  }
  const problem =
    problemCandidate.splice(getRandomInt(0, problemCandidate.length), 1)[0];
  const [kanji, yomis] = problem;
  answerKanji = kanji;
  answerYomis = yomis;
  hideAnswer();
  document.getElementById("problem").textContent = answerKanji;
  document.getElementById("answer").textContent = answerYomis.join(", ");
  document.getElementById("reply").textContent = "";
  setTypePanel();
}

function initProblems() {
  const grade = document.getElementById("gradeOption").selectedIndex + 1;
  fetch("data/" + grade + ".tsv")
    .then((response) => response.text())
    .then((tsv) => {
      problems = [];
      tsv.trimEnd().split(/\n/).forEach((line) => {
        const [kanji, yomis] = line.split("\t");
        problems.push([kanji, yomis.split("|")]);
      });
      problemCandidate = problems.slice();
    });
}

let gameTimer;
function startGameTimer() {
  clearInterval(gameTimer);
  const timeNode = document.getElementById("time");
  initTime();
  gameTimer = setInterval(() => {
    const t = parseInt(timeNode.textContent);
    if (t > 0) {
      timeNode.textContent = t - 1;
    } else {
      clearInterval(gameTimer);
      playAudio(endAudio);
      playPanel.classList.add("d-none");
      scorePanel.classList.remove("d-none");
      document.getElementById("score").textContent = correctCount;
      document.getElementById("total").textContent = problemCount;
    }
  }, 1000);
}

let countdownTimer;
function countdown() {
  clearTimeout(countdownTimer);
  countPanel.classList.remove("d-none");
  playPanel.classList.add("d-none");
  scorePanel.classList.add("d-none");
  const counter = document.getElementById("counter");
  counter.textContent = 3;
  countdownTimer = setInterval(() => {
    const colors = ["skyblue", "greenyellow", "violet", "tomato"];
    if (parseInt(counter.textContent) > 1) {
      const t = parseInt(counter.textContent) - 1;
      counter.style.backgroundColor = colors[t];
      counter.textContent = t;
    } else {
      clearTimeout(countdownTimer);
      countPanel.classList.add("d-none");
      playPanel.classList.remove("d-none");
      correctCount = problemCount = 0;
      document.getElementById("score").textContent = correctCount;
      document.getElementById("total").textContent = problemCount - 1;
      nextProblem();
      startGameTimer();
    }
  }, 1000);
}

function initTime() {
  document.getElementById("time").textContent = gameTime;
}

function shuffle(array) {
  for (let i = array.length; 1 < i; i--) {
    const k = Math.floor(Math.random() * i);
    [array[k], array[i - 1]] = [array[i - 1], array[k]];
  }
  return array;
}

function setTypePanel() {
  const aiueo = Array.from("ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろわん");
  const arr = [];
  // 複数の読みを可能な限りサポート
  answerYomis.forEach((answerYomi) => {
    arr.push(...Array.from(answerYomi));
  });
  arr.push(...shuffle(aiueo));
  const candidates = [...new Set(arr)].slice(0, 8);
  shuffle(candidates);
  const typePanel = document.getElementById("typePanel");
  const buttons = [...typePanel.getElementsByTagName("button")];
  buttons.slice(0, 8).forEach((button, i) => {
    button.textContent = candidates[i];
  });
}

function initTypePanel() {
  const typePanel = document.getElementById("typePanel");
  const buttons = [...typePanel.getElementsByTagName("button")];
  const replyObj = document.getElementById("reply");
  buttons.slice(0, 8).forEach((button, i) => {
    button.onclick = () => {
      replyObj.textContent += button.textContent;
      if (answerYomis.some((answerYomi) => answerYomi == replyObj.textContent)) {
        playAudio(correctAudio);
        if (!hinted) correctCount += 1;
        nextProblem();
      } else {
        playAudio(keyboardAudio);
      }
    };
  });
  buttons[8].onclick = () => {
    const replyText = replyObj.textContent;
    replyObj.textContent = replyText.slice(0, replyText.length - 1);
  };
}

initTypePanel();
initProblems();

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("restartButton").onclick = countdown;
document.getElementById("startButton").onclick = countdown;
document.getElementById("showAnswer").onclick = showAnswer;
document.getElementById("gradeOption").onchange = initProblems;
document.addEventListener("click", unlockAudio, {
  once: true,
  useCapture: true,
});

// disable troublesome iOS features
if (/Macintosh/.test(navigator.userAgent)) {
  // double tap zoom
  document.ondblclick = (e) => {
    e.preventDefault();
  };
  // selection context menu
  // TODO: need better solution
  document.body.style.webkitUserSelect = "none";
}
