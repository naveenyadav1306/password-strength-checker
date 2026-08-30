const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const clearPassword = document.getElementById("clearPassword");
const generatorLength = document.getElementById("generatorLength");
const generatorLengthValue = document.getElementById("generatorLengthValue");

const useUppercase = document.getElementById("useUppercase");
const useLowercase = document.getElementById("useLowercase");
const useNumbers = document.getElementById("useNumbers");
const useSymbols = document.getElementById("useSymbols");

const generatePassword = document.getElementById("generatePassword");
const copyPassword = document.getElementById("copyPassword");
const generatorMessage = document.getElementById("generatorMessage");

const strengthText = document.getElementById("strengthText");
const strengthProgress = document.getElementById("strengthProgress");
const scoreElement = document.getElementById("score");
const passwordLength = document.getElementById("passwordLength");
const lengthLabel = document.getElementById("lengthLabel");
const entropyElement = document.getElementById("entropy");
const passedCount = document.getElementById("passedCount");
const tipText = document.getElementById("tipText");

const warning = document.getElementById("warning");
const warningText = document.getElementById("warningText");

const requirements = {
    length: document.getElementById("lengthRequirement"),
    uppercase: document.getElementById("uppercaseRequirement"),
    lowercase: document.getElementById("lowercaseRequirement"),
    number: document.getElementById("numberRequirement"),
    special: document.getElementById("specialRequirement")
};

const commonPasswords = new Set([
    "password",
    "password123",
    "123456",
    "12345678",
    "123456789",
    "qwerty",
    "qwerty123",
    "admin",
    "admin123",
    "welcome",
    "welcome123",
    "letmein",
    "iloveyou",
    "abc123"
]);

const strengthLevels = [
    { max: 19, label: "Very Weak" },
    { max: 39, label: "Weak" },
    { max: 59, label: "Medium" },
    { max: 79, label: "Strong" },
    { max: 100, label: "Very Strong" }
];

function getCharacterPool(password) {
    let pool = 0;

    if (/[a-z]/.test(password)) pool += 26;
    if (/[A-Z]/.test(password)) pool += 26;
    if (/[0-9]/.test(password)) pool += 10;
    if (/[^A-Za-z0-9\s]/.test(password)) pool += 33;
    if (/\s/.test(password)) pool += 1;

    return pool;
}

function calculateEntropy(password) {
    if (!password) return 0;

    const pool = getCharacterPool(password);
    if (!pool) return 0;

    return Math.round(password.length * Math.log2(pool));
}

function hasSequentialPattern(password) {
    const lower = password.toLowerCase();

    const sequences = [
        "abcdefghijklmnopqrstuvwxyz",
        "0123456789",
        "qwertyuiop",
        "asdfghjkl",
        "zxcvbnm"
    ];

    for (const sequence of sequences) {
        for (let i = 0; i <= sequence.length - 4; i++) {
            const chunk = sequence.slice(i, i + 4);
            const reversed = chunk.split("").reverse().join("");

            if (lower.includes(chunk) || lower.includes(reversed)) {
                return true;
            }
        }
    }

    return false;
}

function hasRepeatedPattern(password) {
    return /(.)\1{2,}/.test(password);
}

function detectCommonPattern(password) {
    const normalized = password.trim().toLowerCase();

    if (!normalized) return "";

    if (commonPasswords.has(normalized)) {
        return "This password is commonly used and should be avoided.";
    }

    if (hasSequentialPattern(normalized)) {
        return "It contains an obvious sequence such as consecutive keyboard or number patterns.";
    }

    if (hasRepeatedPattern(normalized)) {
        return "It contains repeated characters, which can make it easier to guess.";
    }

    return "";
}

function calculateScore(password) {
    if (!password) return 0;

    let score = 0;

    const length = password.length;

    // Length is the strongest basic factor.
    score += Math.min(length * 4, 48);

    if (/[a-z]/.test(password)) score += 8;
    if (/[A-Z]/.test(password)) score += 8;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^A-Za-z0-9\s]/.test(password)) score += 12;

    // Reward passwords that combine multiple character groups.
    const groups = [
        /[a-z]/.test(password),
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9\s]/.test(password)
    ].filter(Boolean).length;

    if (groups >= 3) score += 5;
    if (groups === 4) score += 4;

    // Longer passwords get a small bonus.
    if (length >= 12) score += 4;
    if (length >= 16) score += 4;

    const commonPattern = detectCommonPattern(password);

    if (commonPasswords.has(password.trim().toLowerCase())) score -= 55;
    if (hasSequentialPattern(password)) score -= 15;
    if (hasRepeatedPattern(password)) score -= 10;

    // Penalize passwords made of only one character group.
    if (groups === 1 && length < 12) score -= 10;

    // Avoid over-rewarding simple repetition.
    if (/^(.)+$/.test(password)) score -= 25;

    // A common pattern should never receive an inflated score.
    if (commonPattern && score > 45) score -= 10;

    return Math.max(0, Math.min(100, Math.round(score)));
}

function getStrength(score) {
    return strengthLevels.find((level) => score <= level.max) || strengthLevels[0];
}

function setRequirement(element, passed) {
    element.classList.toggle("passed", passed);

    const icon = element.querySelector(".status-icon");
    icon.textContent = passed ? "✓" : "○";
}

function updateTip(password, checks, score) {
    if (!password) {
        tipText.textContent = "Use a long, unique passphrase with a mix of character types.";
        return;
    }

    if (score >= 80) {
        tipText.textContent = "Good job. Keep it unique and avoid reusing it across different accounts.";
        return;
    }

    if (!checks.length) {
        tipText.textContent = "Try using at least 8 characters; 12 or more is a better target.";
        return;
    }

    if (!checks.uppercase || !checks.lowercase) {
        tipText.textContent = "Mix uppercase and lowercase letters to increase character variety.";
        return;
    }

    if (!checks.number) {
        tipText.textContent = "Add numbers, but avoid predictable endings such as 123.";
        return;
    }

    if (!checks.special) {
        tipText.textContent = "Add a special character such as !, @, #, or %.";
        return;
    }

    if (password.length < 12) {
        tipText.textContent = "Your password meets the basics. Make it 12+ characters for a stronger result.";
        return;
    }

    tipText.textContent = "Consider using a unique passphrase that is easy for you to remember but difficult to guess.";
}

function analyzePassword() {
    const password = passwordInput.value;

    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9\s]/.test(password)
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const score = calculateScore(password);
    const strength = getStrength(score);
    const entropy = calculateEntropy(password);
    const commonPattern = detectCommonPattern(password);

    setRequirement(requirements.length, checks.length);
    setRequirement(requirements.uppercase, checks.uppercase);
    setRequirement(requirements.lowercase, checks.lowercase);
    setRequirement(requirements.number, checks.number);
    setRequirement(requirements.special, checks.special);

    scoreElement.firstChild.textContent = String(score);
    passwordLength.textContent = String(password.length);
    entropyElement.firstChild.textContent = String(entropy);
    lengthLabel.textContent = `${password.length} ${password.length === 1 ? "character" : "characters"}`;
    passedCount.textContent = `${passed}/5 passed`;

    if (!password) {
        strengthText.textContent = "Waiting for input";
        strengthProgress.style.width = "0%";
        strengthProgress.style.backgroundColor = "#64748b";
        scoreElement.firstChild.textContent = "0";
        entropyElement.firstChild.textContent = "0";
        warning.classList.add("hidden");
        updateTip("", checks, 0);
        return;
    }

    strengthText.textContent = strength.label;
    strengthProgress.style.width = `${score}%`;

    const levelColors = {
        "Very Weak": "#fb7185",
        "Weak": "#f97316",
        "Medium": "#fbbf24",
        "Strong": "#34d399",
        "Very Strong": "#38bdf8"
    };

    const currentColor = levelColors[strength.label];
    strengthProgress.style.backgroundColor = currentColor;
    strengthText.style.color = currentColor;

    if (commonPattern) {
        warningText.textContent = commonPattern;
        warning.classList.remove("hidden");
    } else {
        warning.classList.add("hidden");
    }

    updateTip(password, checks, score);
}
function getSecureRandomIndex(max) {
    if (max <= 0) {
        throw new Error("Invalid random range.");
    }

    const randomArray = new Uint32Array(1);
    const maxUint32 = 0x100000000;
    const limit = maxUint32 - (maxUint32 % max);

    let randomValue;

    do {
        crypto.getRandomValues(randomArray);
        randomValue = randomArray[0];
    } while (randomValue >= limit);

    return randomValue % max;
}

function secureRandomCharacter(characters) {
    return characters[getSecureRandomIndex(characters.length)];
}

function shuffleSecurely(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = getSecureRandomIndex(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

function generateSecurePassword() {
    const length = Number(generatorLength.value);

    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()-_=+[]{}?";

    const selectedSets = [];

    if (useUppercase.checked) selectedSets.push(uppercase);
    if (useLowercase.checked) selectedSets.push(lowercase);
    if (useNumbers.checked) selectedSets.push(numbers);
    if (useSymbols.checked) selectedSets.push(symbols);

    if (selectedSets.length === 0) {
        generatorMessage.textContent = "Select at least one character type.";
        generatorMessage.style.color = "#fb7185";
        return;
    }

    if (length < selectedSets.length) {
        generatorMessage.textContent =
            "Increase the password length to include all selected character types.";
        generatorMessage.style.color = "#fb7185";
        return;
    }

    const passwordCharacters = [];

    for (const characterSet of selectedSets) {
        passwordCharacters.push(
            secureRandomCharacter(characterSet)
        );
    }

    const allCharacters = selectedSets.join("");

    while (passwordCharacters.length < length) {
        passwordCharacters.push(
            secureRandomCharacter(allCharacters)
        );
    }

    shuffleSecurely(passwordCharacters);

    const generatedPassword = passwordCharacters.join("");

    passwordInput.value = generatedPassword;
    passwordInput.type = "text";

    togglePassword.textContent = "🙈";
    togglePassword.setAttribute("aria-label", "Hide password");

    generatorMessage.textContent = "Secure password generated locally.";
    generatorMessage.style.color = "#34d399";

    analyzePassword();
}

togglePassword.addEventListener("click", () => {
    const showing = passwordInput.type === "text";

    passwordInput.type = showing ? "password" : "text";
    togglePassword.textContent = showing ? "👁" : "🙈";
    togglePassword.setAttribute("aria-label", showing ? "Show password" : "Hide password");

    passwordInput.focus();
});

clearPassword.addEventListener("click", () => {
    passwordInput.value = "";
    passwordInput.type = "password";
    togglePassword.textContent = "👁";
    togglePassword.setAttribute("aria-label", "Show password");

    analyzePassword();
    passwordInput.focus();
});

passwordInput.addEventListener("input", analyzePassword);

analyzePassword();
generatorLength.addEventListener("input", () => {
    generatorLengthValue.textContent = generatorLength.value;
});

generatePassword.addEventListener("click", () => {
    generateSecurePassword();
});

copyPassword.addEventListener("click", async () => {
    const password = passwordInput.value;

    if (!password) {
        generatorMessage.textContent =
            "Generate or enter a password first.";
        generatorMessage.style.color = "#fbbf24";
        return;
    }

    try {
        await navigator.clipboard.writeText(password);

        generatorMessage.textContent =
            "Password copied to clipboard.";
        generatorMessage.style.color = "#34d399";

    } catch (error) {
        generatorMessage.textContent =
            "Copy failed. Please copy the password manually.";
        generatorMessage.style.color = "#fb7185";
    }
});
