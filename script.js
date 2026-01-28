let selectedCountry = null;
let filteredCountries = [...countries];
let selectedStyle = null;

// Internal Qualifiers Data
let internalSongs = [];
let currentEditingIndex = null;
let juryVotes = {};
let publicVotes = {};
let internalQualifierWinner = null;
let internalJuryVotesData = [];

// Song styles/genres
const songStyles = [
    'Pop', 'Rock', 'Ballad', 'Electronic', 'Dance', 'Folk',
    'R&B', 'Jazz', 'Country', 'Hip-Hop', 'Opera', 'Indie',
    'Latin', 'Reggae', 'Metal', 'Alternative', 'Soul', 'Blues'
];

// Initialize the country grid
function initializeCountryGrid() {
    const countryGrid = document.getElementById('countryGrid');
    const emptyEl = document.getElementById('countryGridEmpty');
    countryGrid.innerHTML = '';
    
    if (filteredCountries.length === 0) {
        countryGrid.style.display = 'none';
        if (emptyEl) {
            emptyEl.style.display = 'block';
        }
    } else {
        countryGrid.style.display = 'grid';
        if (emptyEl) emptyEl.style.display = 'none';
        filteredCountries.forEach(country => {
            const countryCard = createCountryCard(country);
            countryGrid.appendChild(countryCard);
        });
    }
    updateCountryCount();
}

// Update country count badge
function updateCountryCount() {
    const el = document.getElementById('countryCount');
    if (!el) return;
    const total = countries.length;
    const showing = filteredCountries.length;
    if (showing === total) {
        el.textContent = `${total} countries`;
    } else {
        el.textContent = `${showing} of ${total}`;
    }
}

// Create a country card element
function createCountryCard(country) {
    const card = document.createElement('div');
    card.className = 'country-card';
    card.dataset.countryCode = country.code;
    
    const flag = document.createElement('div');
    flag.className = 'country-flag';
    flag.textContent = country.flag;
    
    const name = document.createElement('div');
    name.className = 'country-name';
    name.textContent = country.name;
    
    const badges = document.createElement('div');
    badges.className = 'country-badges';
    
    if (country.isHost) {
        const hostBadge = document.createElement('span');
        hostBadge.className = 'badge host';
        hostBadge.textContent = 'HOST';
        badges.appendChild(hostBadge);
    }
    
    if (country.isBigFive) {
        const bigFiveBadge = document.createElement('span');
        bigFiveBadge.className = 'badge big-five';
        bigFiveBadge.textContent = 'BIG 5';
        badges.appendChild(bigFiveBadge);
    }
    
    card.appendChild(flag);
    card.appendChild(name);
    card.appendChild(badges);
    
    // Add click event
    card.addEventListener('click', () => selectCountry(country));
    
    return card;
}

// Select a country
function selectCountry(country) {
    // Remove previous selection
    if (selectedCountry) {
        const previousCard = document.querySelector(`[data-country-code="${selectedCountry.code}"]`);
        if (previousCard) {
            previousCard.classList.remove('selected');
        }
    }
    
    selectedCountry = country;
    
    // Highlight selected card
    const selectedCard = document.querySelector(`[data-country-code="${country.code}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    // Show selected country info
    showSelectedCountryInfo(country);
}

// Get qualifier method for a country
function getQualifierMethod(country) {
    if (country.isHost) {
        return {
            method: 'automatic',
            description: 'Automatic Qualification (Host Country)',
            semiFinal: null
        };
    } else if (country.isBigFive) {
        return {
            method: 'automatic',
            description: 'Automatic Qualification (Big Five)',
            semiFinal: null
        };
    } else {
        // For non-automatic qualifiers, determine which semi-final they would be in
        // This is a simplified assignment - in reality, semi-finals are drawn
        const semiFinalNumber = determineSemiFinal(country);
        return {
            method: 'semi-final',
            description: `Must Qualify Through Semi-Final ${semiFinalNumber}`,
            semiFinal: semiFinalNumber
        };
    }
}

// Determine which semi-final a country would participate in
// This is a simplified version - in reality, semi-finals are drawn
function determineSemiFinal(country) {
    // Excluding automatic qualifiers from the count
    const nonAutomaticCountries = countries.filter(c => !c.isHost && !c.isBigFive);
    const countryPosition = nonAutomaticCountries.findIndex(c => c.code === country.code);
    const totalNonAutomatic = nonAutomaticCountries.length;
    
    // For 2025: Semi-final 1 has 16 countries, Semi-final 2 has 17 countries
    if (currentYear === 2025) {
        return countryPosition < 16 ? 1 : 2;
    }
    
    // For 2026 and other years: Split roughly in half
    // Semi-final 1 gets first half, Semi-final 2 gets second half
    return countryPosition < Math.ceil(totalNonAutomatic / 2) ? 1 : 2;
}

// Show selected country information
function showSelectedCountryInfo(country) {
    const selectedCountryDiv = document.getElementById('selectedCountry');
    const selectedInfo = document.getElementById('selectedInfo');
    
    const qualifierInfo = getQualifierMethod(country);
    
    let badgesHTML = '';
    if (country.isHost) badgesHTML += '<span class="badge host">HOST</span>';
    if (country.isBigFive) badgesHTML += '<span class="badge big-five">BIG 5</span>';
    
    const infoHTML = `
        <span class="selected-flag">${country.flag}</span>
        <span class="selected-name">${country.name}</span>
        ${badgesHTML}
        <div class="selected-meta"><strong>Qualifier:</strong> ${qualifierInfo.description}</div>
    `;
    
    selectedInfo.innerHTML = infoHTML;
    selectedCountryDiv.style.display = 'block';
    document.getElementById('countrySelectionScreen').classList.add('has-selection');
}

// Confirm selection and navigate to song details screen
function confirmSelection() {
    if (selectedCountry) {
        // Store selected country in localStorage
        localStorage.setItem('selectedCountry', JSON.stringify(selectedCountry));
        
        // Hide country selection screen
        document.getElementById('countrySelectionScreen').style.display = 'none';
        
        // Show song details screen
        showSongDetailsScreen();
    }
}

// Show song details screen
function showSongDetailsScreen() {
    const songDetailsScreen = document.getElementById('songDetailsScreen');
    const countrySubtitle = document.getElementById('countrySubtitle');
    
    // Update subtitle with selected country
    countrySubtitle.textContent = `Create Your Entry for ${selectedCountry.flag} ${selectedCountry.name}`;
    
    // Check for internal qualifier winner
    const savedWinner = localStorage.getItem('internalQualifierWinner');
    if (savedWinner) {
        try {
            const winner = JSON.parse(savedWinner);
            // Show notification about winner
            const formContainer = document.querySelector('.song-form-container');
            if (formContainer && !formContainer.querySelector('.winner-notification')) {
                const notification = document.createElement('div');
                notification.className = 'winner-notification';
                notification.style.cssText = 'background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;';
                notification.innerHTML = `
                    <h4 style="margin-bottom: 10px; color: #333;">🏆 Internal Qualifier Winner Available!</h4>
                    <p style="margin-bottom: 15px; color: #555;">"${winner.songName}" by ${winner.artistName}</p>
                    <button type="button" class="submit-btn" id="useWinnerBtn2" style="padding: 10px 30px; font-size: 1rem;">Use This Entry</button>
                `;
                formContainer.insertBefore(notification, formContainer.firstChild);
                
                document.getElementById('useWinnerBtn2').addEventListener('click', () => {
                    useWinnerForEntry();
                });
            }
        } catch (e) {
            console.error('Error parsing saved winner:', e);
        }
    }
    
    // Initialize style grid
    initializeStyleGrid();
    
    // Show the screen
    songDetailsScreen.style.display = 'block';
}

// Initialize style selection grid
function initializeStyleGrid() {
    const styleGrid = document.getElementById('styleGrid');
    styleGrid.innerHTML = '';
    
    songStyles.forEach(style => {
        const styleOption = document.createElement('div');
        styleOption.className = 'style-option';
        styleOption.textContent = style;
        styleOption.dataset.style = style;
        
        styleOption.addEventListener('click', () => selectStyle(style));
        
        styleGrid.appendChild(styleOption);
    });
}

// Select a song style
function selectStyle(style) {
    // Remove previous selection
    if (selectedStyle) {
        const previousOption = document.querySelector(`[data-style="${selectedStyle}"]`);
        if (previousOption) {
            previousOption.classList.remove('selected');
        }
    }
    
    selectedStyle = style;
    
    // Highlight selected option
    const selectedOption = document.querySelector(`[data-style="${style}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
}

// Handle form submission
function handleSongFormSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const songName = document.getElementById('songName').value.trim();
    const artistName = document.getElementById('artistName').value.trim();
    const language = document.getElementById('language').value;
    const tempo = document.getElementById('tempo').value;
    const description = document.getElementById('description').value.trim();
    
    // Validate required fields
    if (!songName || !artistName || !selectedStyle) {
        alert('Please fill in all required fields (Song Name, Artist Name, and Song Style)');
        return;
    }
    
    // Create song entry object
    const songEntry = {
        country: selectedCountry,
        songName: songName,
        artistName: artistName,
        style: selectedStyle,
        language: language,
        tempo: tempo,
        description: description
    };
    
    // Store in localStorage
    localStorage.setItem('songEntry', JSON.stringify(songEntry));
    
    // Get qualifier method and navigate to appropriate screen
    const qualifierInfo = getQualifierMethod(selectedCountry);
    
    // Hide song details screen
    document.getElementById('songDetailsScreen').style.display = 'none';
    
    // Navigate based on qualifier method
    if (qualifierInfo.method === 'automatic') {
        // For automatic qualifiers (Big 5 or Host), show semi-final 1 qualifiers
        // They automatically qualify, so we show the draw for semi-final 1
        showFinalDraw(1, songEntry);
    } else {
        // Show the appropriate semi-final screen
        showSemiFinalScreen(qualifierInfo.semiFinal, songEntry);
    }
}

// Show semi-final screen
function showSemiFinalScreen(semiFinalNumber, songEntry) {
    // Hide all screens first
    document.getElementById('countrySelectionScreen').style.display = 'none';
    document.getElementById('songDetailsScreen').style.display = 'none';
    document.getElementById('semiFinal1Screen').style.display = 'none';
    document.getElementById('semiFinal2Screen').style.display = 'none';
    document.getElementById('finalDrawScreen').style.display = 'none';
    
    // Show the appropriate semi-final screen
    const screenId = semiFinalNumber === 1 ? 'semiFinal1Screen' : 'semiFinal2Screen';
    const previewId = semiFinalNumber === 1 ? 'semiFinal1EntryPreview' : 'semiFinal2EntryPreview';
    const buttonId = semiFinalNumber === 1 ? 'startSemiFinal1Btn' : 'startSemiFinal2Btn';
    
    document.getElementById(screenId).style.display = 'block';
    
    // Populate entry preview
    const preview = document.getElementById(previewId);
    preview.innerHTML = `
        <h4>${songEntry.country.flag} ${songEntry.country.name}</h4>
        <p><strong>"${songEntry.songName}"</strong></p>
        <p>by ${songEntry.artistName}</p>
        <p>Style: ${songEntry.style}</p>
    `;
    
    // Set up button click handler
    const startBtn = document.getElementById(buttonId);
    startBtn.onclick = () => showSemiFinalJuryVotingAnimation(semiFinalNumber, songEntry);
}

// Calculate semi-final standings with points 0-149
function calculateSemiFinalStandings(semiFinalCountries) {
    // Create standings array with random points (0-149)
    const standings = semiFinalCountries.map(country => ({
        country: country,
        points: Math.floor(Math.random() * 150) // 0 to 149 inclusive
    }));
    
    // Sort by points (descending)
    standings.sort((a, b) => {
        if (b.points !== a.points) {
            return b.points - a.points;
        }
        // Tie-breaker: random (or could use country code)
        return Math.random() - 0.5;
    });
    
    return standings;
}

// Calculate semi-final standings from jury votes
function calculateSemiFinalStandingsFromJuryVotes(semiFinalCountries, juryVotesData) {
    // Initialize points for each country
    const countryPoints = {};
    
    semiFinalCountries.forEach(country => {
        countryPoints[country.code] = 0;
    });
    
    // Add up all jury votes
    juryVotesData.forEach(votingData => {
        const votes = votingData.votes;
        Object.keys(votes).forEach(receivingCountryCode => {
            const points = votes[receivingCountryCode];
            if (countryPoints.hasOwnProperty(receivingCountryCode)) {
                countryPoints[receivingCountryCode] += points;
            }
        });
    });
    
    // Create standings array
    const standings = semiFinalCountries.map(country => ({
        country: country,
        points: countryPoints[country.code]
    }));
    
    // Sort by points (descending)
    standings.sort((a, b) => {
        if (b.points !== a.points) {
            return b.points - a.points;
        }
        // Tie-breaker: alphabetical by country code
        return a.country.code.localeCompare(b.country.code);
    });
    
    return standings;
}

// Show Semi-Final Standings screen
function showSemiFinalStandings(semiFinalNumber, songEntry, preCalculatedStandings = null) {
    // Hide all screens
    document.getElementById('countrySelectionScreen').style.display = 'none';
    document.getElementById('songDetailsScreen').style.display = 'none';
    document.getElementById('semiFinal1Screen').style.display = 'none';
    document.getElementById('semiFinal2Screen').style.display = 'none';
    document.getElementById('semiFinal1StandingsScreen').style.display = 'none';
    document.getElementById('semiFinal2StandingsScreen').style.display = 'none';
    document.getElementById('finalDrawScreen').style.display = 'none';
    document.getElementById('grandFinalScreen').style.display = 'none';
    document.getElementById('juryVotingAnimationScreen').style.display = 'none';
    
    // Get countries in this semi-final
    const semiFinalCountries = getSemiFinalCountries(semiFinalNumber, songEntry.country, false);
    
    // Use pre-calculated standings if provided, otherwise calculate
    const standings = preCalculatedStandings || calculateSemiFinalStandings(semiFinalCountries);
    
    // Show the appropriate standings screen
    const screenId = semiFinalNumber === 1 ? 'semiFinal1StandingsScreen' : 'semiFinal2StandingsScreen';
    const tableBodyId = semiFinalNumber === 1 ? 'semiFinal1StandingsTableBody' : 'semiFinal2StandingsTableBody';
    const userCardId = semiFinalNumber === 1 ? 'semiFinal1StandingsUserQualifierCard' : 'semiFinal2StandingsUserQualifierCard';
    const continueBtnId = semiFinalNumber === 1 ? 'continueSemiFinal1Btn' : 'continueSemiFinal2Btn';
    
    document.getElementById(screenId).style.display = 'block';
    
    // Display standings table
    const tableBody = document.getElementById(tableBodyId);
    const tableId = semiFinalNumber === 1 ? 'semiFinal1StandingsTable' : 'semiFinal2StandingsTable';
    
    // Convert standings format for semi-final (points instead of totalPoints)
    const formattedStandings = standings.map(entry => ({
        ...entry,
        totalPoints: entry.points,
        juryPoints: entry.points
    }));
    
    renderStandingsTableRows(tableBody, formattedStandings, songEntry, 'semi');
    
    // Setup sortable headers
    setupSortableTable(tableId, formattedStandings, songEntry, 'semi');
    
    // Display user's entry with their ranking
    const userStanding = standings.findIndex(s => s.country.code === songEntry.country.code);
    const userEntry = standings[userStanding];
    
    if (userEntry) {
        const userCard = document.getElementById(userCardId);
        let rankDisplay = userStanding + 1;
        if (userStanding === 0) rankDisplay = '🥇 1st Place';
        else if (userStanding === 1) rankDisplay = '🥈 2nd Place';
        else if (userStanding === 2) rankDisplay = '🥉 3rd Place';
        else {
            const suffix = ['th', 'st', 'nd', 'rd'][((userStanding + 1) % 100 - 10) % 10] || 'th';
            rankDisplay = `${userStanding + 1}${suffix} Place`;
        }
        
        userCard.innerHTML = `
            <div class="user-qualifier-content">
                <div class="user-qualifier-flag">${songEntry.country.flag}</div>
                <div class="user-qualifier-info">
                    <div class="user-qualifier-country">${songEntry.country.name}</div>
                    <div class="user-qualifier-song">"${songEntry.songName}"</div>
                    <div class="user-qualifier-artist">by ${songEntry.artistName}</div>
                    <div style="margin-top: 10px; font-size: 1.2rem; font-weight: bold;">
                        Ranking: ${rankDisplay}
                    </div>
                    <div style="margin-top: 5px; font-size: 1.1rem;">
                        Points: ${userEntry.points}
                    </div>
                </div>
                <div class="user-qualifier-badge">${rankDisplay}</div>
            </div>
        `;
        
        // Color based on ranking
        if (userStanding === 0) {
            userCard.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)';
        } else if (userStanding === 1) {
            userCard.style.background = 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)';
        } else if (userStanding === 2) {
            userCard.style.background = 'linear-gradient(135deg, #cd7f32 0%, #e6a85c 100%)';
        } else if (userStanding < 10) {
            userCard.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        } else {
            userCard.style.background = 'linear-gradient(135deg, #999 0%, #bbb 100%)';
        }
    }
    
    // Store standings for qualifier selection (top 10 qualify)
    localStorage.setItem(`semiFinal${semiFinalNumber}Standings`, JSON.stringify(standings));
    
    // Set up continue button to show qualifiers
    const continueBtn = document.getElementById(continueBtnId);
    if (continueBtn) {
        continueBtn.onclick = () => showFinalDraw(semiFinalNumber, songEntry);
    }
}

// Show Final Draw screen
function showFinalDraw(semiFinalNumber, songEntry) {
    // Hide all screens
    document.getElementById('countrySelectionScreen').style.display = 'none';
    document.getElementById('songDetailsScreen').style.display = 'none';
    document.getElementById('semiFinal1Screen').style.display = 'none';
    document.getElementById('semiFinal2Screen').style.display = 'none';
    document.getElementById('semiFinal1StandingsScreen').style.display = 'none';
    document.getElementById('semiFinal2StandingsScreen').style.display = 'none';
    document.getElementById('grandFinalScreen').style.display = 'none';
    document.getElementById('finalDrawScreen').style.display = 'block';
    
    // Check if user's country is automatic qualifier (Big 5 or Host)
    const isUserAutomatic = songEntry.country.isHost || songEntry.country.isBigFive;
    
    // Determine user's actual semi-final (if not automatic)
    const userSemiFinal = isUserAutomatic ? null : determineSemiFinal(songEntry.country);
    const actualSemiFinalNumber = isUserAutomatic ? semiFinalNumber : userSemiFinal;
    
    // Get qualifiers from user's semi-final (or the semi-final they selected)
    // Use standings if available, otherwise select randomly
    const userSemiFinalCountries = getSemiFinalCountries(actualSemiFinalNumber || semiFinalNumber, songEntry.country, false);
    let userSemiFinalQualifiers;
    const storedStandings = localStorage.getItem(`semiFinal${actualSemiFinalNumber || semiFinalNumber}Standings`);
    if (storedStandings) {
        const standings = JSON.parse(storedStandings);
        // Top 10 from standings qualify
        userSemiFinalQualifiers = standings.slice(0, 10).map(s => s.country);
    } else {
        userSemiFinalQualifiers = selectQualifiers(userSemiFinalCountries, 10);
    }
    
    // Get qualifiers from the other semi-final
    const otherSemiFinalNumber = (actualSemiFinalNumber || semiFinalNumber) === 1 ? 2 : 1;
    const otherSemiFinalCountries = getSemiFinalCountries(otherSemiFinalNumber, songEntry.country, false);
    const otherSemiFinalQualifiers = selectQualifiers(otherSemiFinalCountries, 10);
    
    // Get automatic qualifiers (Big Five + Host)
    const automaticQualifiers = countries.filter(country => 
        country.isBigFive || country.isHost
    );
    
    // Update title
    document.getElementById('finalDrawTitle').textContent = `Grand Final Qualifiers`;
    document.getElementById('finalDrawSubtitle').textContent = 'All countries that have qualified for the Grand Final!';
    
    // Display user's semi-final qualifiers
    const qualifiersHeader = document.getElementById('qualifiersHeader');
    qualifiersHeader.textContent = `Semi-Final ${actualSemiFinalNumber || semiFinalNumber} Qualifiers (10)`;
    displayQualifiersInGrid(userSemiFinalQualifiers, 'qualifiersGrid');
    
    // Display other semi-final qualifiers
    document.getElementById('otherSemiFinalSection').style.display = 'block';
    document.getElementById('otherSemiFinalHeader').textContent = `Semi-Final ${otherSemiFinalNumber} Qualifiers (10)`;
    displayQualifiersInGrid(otherSemiFinalQualifiers, 'otherSemiFinalGrid');
        
    // Display automatic qualifiers
    document.getElementById('automaticQualifiersSection').style.display = 'block';
    displayQualifiersInGrid(automaticQualifiers, 'automaticQualifiersGrid');
    
    // Check if user qualified (if not automatic)
    let userQualified = true;
    if (!isUserAutomatic) {
        userQualified = userSemiFinalQualifiers.some(q => q.code === songEntry.country.code);
    }
        
        // Display user's entry status
    displayUserQualifier(songEntry, isUserAutomatic, userQualified);
    
    // Store final participants for the Final screen (remove duplicates)
    const allFinalParticipants = [
        ...userSemiFinalQualifiers,
        ...otherSemiFinalQualifiers,
        ...automaticQualifiers
    ];
    
    // Remove duplicates based on country code
    const uniqueParticipants = [];
    const seenCodes = new Set();
    allFinalParticipants.forEach(country => {
        if (!seenCodes.has(country.code)) {
            seenCodes.add(country.code);
            uniqueParticipants.push(country);
        }
    });
    
    localStorage.setItem('finalParticipants', JSON.stringify(uniqueParticipants));
    localStorage.setItem('songEntry', JSON.stringify(songEntry));
    
    // Show continue button
    const continueBtn = document.getElementById('continueToFinalBtn');
    continueBtn.style.display = 'block';
    continueBtn.onclick = () => showFinalScreen(songEntry);
}

// Get countries participating in a specific semi-final
function getSemiFinalCountries(semiFinalNumber, userCountry, excludeUser) {
    // Get all countries that are not automatic qualifiers
    let nonAutomaticCountries = countries.filter(country => 
        !country.isHost && !country.isBigFive
    );
    
    // Exclude user's country if they are automatic qualifier
    if (excludeUser) {
        nonAutomaticCountries = nonAutomaticCountries.filter(country => 
            country.code !== userCountry.code
        );
    }
    
    // Filter to only countries in the specified semi-final
    const semiFinalCountries = nonAutomaticCountries.filter(country => {
        const countrySemiFinal = determineSemiFinal(country);
        return countrySemiFinal === semiFinalNumber;
    });
    
    // If user is not excluded and should be in this semi-final, ensure they're included
    if (!excludeUser) {
        const userSemiFinal = determineSemiFinal(userCountry);
        if (userSemiFinal === semiFinalNumber) {
            // Check if user is already in the list
            if (!semiFinalCountries.find(c => c.code === userCountry.code)) {
                semiFinalCountries.push(userCountry);
            }
        }
    }
    
    return semiFinalCountries;
}

// Select random qualifiers from semi-final countries
function selectQualifiers(semiFinalCountries, count) {
    // Create a copy and shuffle
    const shuffled = [...semiFinalCountries].sort(() => Math.random() - 0.5);
    
    // Select the specified number of qualifiers
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Display qualifiers on the screen (legacy function for compatibility)
function displayQualifiers(qualifiers, headerText) {
    const qualifiersSection = document.querySelector('.qualifiers-section');
    const qualifiersHeader = qualifiersSection.querySelector('.qualifiers-header');
    const qualifiersGrid = document.getElementById('qualifiersGrid');
    
    qualifiersHeader.textContent = headerText;
    qualifiersGrid.innerHTML = '';
    
    qualifiers.forEach((country, index) => {
        const qualifierCard = document.createElement('div');
        qualifierCard.className = 'qualifier-card';
        qualifierCard.innerHTML = `
            <div class="qualifier-number">${index + 1}</div>
            <div class="qualifier-flag">${country.flag}</div>
            <div class="qualifier-name">${country.name}</div>
        `;
        qualifiersGrid.appendChild(qualifierCard);
    });
}

// Display qualifiers in a specific grid
function displayQualifiersInGrid(qualifiers, gridId) {
    const qualifiersGrid = document.getElementById(gridId);
    qualifiersGrid.innerHTML = '';
    
    qualifiers.forEach((country, index) => {
        const qualifierCard = document.createElement('div');
        qualifierCard.className = 'qualifier-card';
        qualifierCard.innerHTML = `
            <div class="qualifier-number">${index + 1}</div>
            <div class="qualifier-flag">${country.flag}</div>
            <div class="qualifier-name">${country.name}</div>
        `;
        qualifiersGrid.appendChild(qualifierCard);
    });
}

// Display user's qualifier entry
function displayUserQualifier(songEntry, isAutomatic, qualified = true) {
    const userQualifierSection = document.querySelector('.user-qualifier-section');
    const userQualifierHeader = userQualifierSection.querySelector('.qualifiers-header');
    const userQualifierCard = document.getElementById('userQualifierCard');
    
    if (isAutomatic) {
        userQualifierHeader.textContent = 'Automatic Qualifiers';
    } else {
        userQualifierHeader.textContent = 'Your Entry';
    }
    
    if (qualified) {
        userQualifierCard.innerHTML = `
            <div class="user-qualifier-content">
                <div class="user-qualifier-flag">${songEntry.country.flag}</div>
                <div class="user-qualifier-info">
                    <div class="user-qualifier-country">${songEntry.country.name}</div>
                    <div class="user-qualifier-song">"${songEntry.songName}"</div>
                    <div class="user-qualifier-artist">by ${songEntry.artistName}</div>
                </div>
                <div class="user-qualifier-badge">QUALIFIED</div>
            </div>
        `;
        userQualifierCard.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)';
    } else {
        userQualifierCard.innerHTML = `
            <div class="user-qualifier-content">
                <div class="user-qualifier-flag">${songEntry.country.flag}</div>
                <div class="user-qualifier-info">
                    <div class="user-qualifier-country">${songEntry.country.name}</div>
                    <div class="user-qualifier-song">"${songEntry.songName}"</div>
                    <div class="user-qualifier-artist">by ${songEntry.artistName}</div>
                </div>
                <div class="user-qualifier-badge" style="background: #999;">ELIMINATED</div>
            </div>
        `;
        userQualifierCard.style.background = 'linear-gradient(135deg, #999 0%, #bbb 100%)';
    }
}

// Show Grand Final screen with all participants
function showFinalScreen(songEntry) {
    // Hide all screens
    document.getElementById('countrySelectionScreen').style.display = 'none';
    document.getElementById('songDetailsScreen').style.display = 'none';
    document.getElementById('semiFinal1Screen').style.display = 'none';
    document.getElementById('semiFinal2Screen').style.display = 'none';
    document.getElementById('semiFinal1StandingsScreen').style.display = 'none';
    document.getElementById('semiFinal2StandingsScreen').style.display = 'none';
    document.getElementById('finalDrawScreen').style.display = 'none';
    document.getElementById('grandFinalScreen').style.display = 'block';
    
    // Get final participants from localStorage
    let allFinalParticipants = [];
    const storedParticipants = localStorage.getItem('finalParticipants');
    if (storedParticipants) {
        allFinalParticipants = JSON.parse(storedParticipants);
    } else {
        // Fallback: reconstruct if not stored
        const userSemiFinal = songEntry.country.isHost || songEntry.country.isBigFive ? 
            null : determineSemiFinal(songEntry.country);
        const actualSemiFinalNumber = userSemiFinal || 1;
        const otherSemiFinalNumber = actualSemiFinalNumber === 1 ? 2 : 1;
        
        const userSemiFinalCountries = getSemiFinalCountries(actualSemiFinalNumber, songEntry.country, false);
        const otherSemiFinalCountries = getSemiFinalCountries(otherSemiFinalNumber, songEntry.country, false);
        
        const userSemiFinalQualifiers = selectQualifiers(userSemiFinalCountries, 10);
        const otherSemiFinalQualifiers = selectQualifiers(otherSemiFinalCountries, 10);
        const automaticQualifiers = countries.filter(country => 
            country.isBigFive || country.isHost
        );
        
        allFinalParticipants = [
            ...userSemiFinalQualifiers,
            ...otherSemiFinalQualifiers,
            ...automaticQualifiers
        ];
        
        // Remove duplicates based on country code
        const seenCodes = new Set();
        const uniqueParticipants = [];
        allFinalParticipants.forEach(country => {
            if (!seenCodes.has(country.code)) {
                seenCodes.add(country.code);
                uniqueParticipants.push(country);
            }
        });
        allFinalParticipants = uniqueParticipants;
    }
    
    // Shuffle final participants for random order
    const shuffledParticipants = [...allFinalParticipants].sort(() => Math.random() - 0.5);
    
    // Display all final participants
    displayQualifiersInGrid(shuffledParticipants, 'finalParticipantsGrid');
    
    // Display user's entry
    const isUserAutomatic = songEntry.country.isHost || songEntry.country.isBigFive;
    const userQualified = isUserAutomatic || allFinalParticipants.some(p => p.code === songEntry.country.code);
    
    const finalUserQualifierCard = document.getElementById('finalUserQualifierCard');
    if (userQualified) {
        finalUserQualifierCard.innerHTML = `
            <div class="user-qualifier-content">
                <div class="user-qualifier-flag">${songEntry.country.flag}</div>
                <div class="user-qualifier-info">
                    <div class="user-qualifier-country">${songEntry.country.name}</div>
                    <div class="user-qualifier-song">"${songEntry.songName}"</div>
                    <div class="user-qualifier-artist">by ${songEntry.artistName}</div>
                </div>
                <div class="user-qualifier-badge">IN THE FINAL</div>
            </div>
        `;
        finalUserQualifierCard.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)';
    } else {
        finalUserQualifierCard.innerHTML = `
            <div class="user-qualifier-content">
                <div class="user-qualifier-flag">${songEntry.country.flag}</div>
                <div class="user-qualifier-info">
                    <div class="user-qualifier-country">${songEntry.country.name}</div>
                    <div class="user-qualifier-song">"${songEntry.songName}"</div>
                    <div class="user-qualifier-artist">by ${songEntry.artistName}</div>
                </div>
                <div class="user-qualifier-badge" style="background: #999;">ELIMINATED</div>
            </div>
        `;
        finalUserQualifierCard.style.background = 'linear-gradient(135deg, #999 0%, #bbb 100%)';
    }
    
    // Set up button to show jury voting
    const showJuryVotingBtn = document.getElementById('showJuryVotingBtn');
    if (showJuryVotingBtn) {
        showJuryVotingBtn.onclick = () => showJuryVotingAnimation(songEntry, allFinalParticipants);
    }
}

// Generate jury votes from a voting country to all participating countries
function generateJuryVotes(votingCountry, allParticipants) {
    // Countries cannot vote for themselves
    const eligibleParticipants = allParticipants.filter(p => p.code !== votingCountry.code);
    
    // Shuffle and select top 8 (will receive points)
    const shuffled = [...eligibleParticipants].sort(() => Math.random() - 0.5);
    const top8 = shuffled.slice(0, 8);
    
    // Award points: 12, 10, 8, 6, 5, 4, 2, 1
    const points = [12, 10, 8, 6, 5, 4, 2, 1];
    const votes = {};
    
    top8.forEach((country, index) => {
        votes[country.code] = points[index];
    });
    
    return votes;
}

// Calculate final standings from all jury votes
function calculateFinalStandings(allParticipants, juryVotesData = null) {
    // Initialize points for each country
    const countryPoints = {};
    const countryVoteBreakdown = {};
    
    allParticipants.forEach(country => {
        countryPoints[country.code] = 0;
        countryVoteBreakdown[country.code] = {
            12: 0,
            10: 0,
            8: 0,
            6: 0,
            5: 0,
            4: 0,
            2: 0,
            1: 0
        };
    });
    
    // Use provided jury votes data or generate new ones
    const votesData = juryVotesData || [];
    
    // Each country votes
    allParticipants.forEach((votingCountry, index) => {
        let votes;
        if (votesData && votesData.length > 0 && votesData[index]) {
            votes = votesData[index].votes;
        } else {
            votes = generateJuryVotes(votingCountry, allParticipants);
        }
        
        // Add votes to totals
        Object.keys(votes).forEach(receivingCountryCode => {
            const points = votes[receivingCountryCode];
            countryPoints[receivingCountryCode] += points;
            countryVoteBreakdown[receivingCountryCode][points]++;
        });
    });
    
    // Create standings array
    const standings = allParticipants.map(country => ({
        country: country,
        totalPoints: countryPoints[country.code],
        breakdown: countryVoteBreakdown[country.code]
    }));
    
    // Sort by total points (descending)
    standings.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
        }
        // Tie-breaker: most 12 points, then 10, etc.
        const pointsOrder = [12, 10, 8, 6, 5, 4, 2, 1];
        for (const pointValue of pointsOrder) {
            if (b.breakdown[pointValue] !== a.breakdown[pointValue]) {
                return b.breakdown[pointValue] - a.breakdown[pointValue];
            }
        }
        return 0;
    });
    
    return standings;
}

// Show Semi-Final Jury Voting Animation
function showSemiFinalJuryVotingAnimation(semiFinalNumber, songEntry) {
    // Hide all screens
    document.getElementById('countrySelectionScreen').style.display = 'none';
    document.getElementById('songDetailsScreen').style.display = 'none';
    document.getElementById('semiFinal1Screen').style.display = 'none';
    document.getElementById('semiFinal2Screen').style.display = 'none';
    document.getElementById('semiFinal1StandingsScreen').style.display = 'none';
    document.getElementById('semiFinal2StandingsScreen').style.display = 'none';
    document.getElementById('finalDrawScreen').style.display = 'none';
    document.getElementById('grandFinalScreen').style.display = 'none';
    document.getElementById('finalStandingsScreen').style.display = 'none';
    document.getElementById('combinedResultsScreen').style.display = 'none';
    document.getElementById('juryVotingAnimationScreen').style.display = 'block';
    
    // Get countries in this semi-final
    const semiFinalCountries = getSemiFinalCountries(semiFinalNumber, songEntry.country, false);
    
    // Update subtitle to show it's a semi-final
    document.querySelector('#juryVotingAnimationScreen .subtitle').textContent = `Semi-Final ${semiFinalNumber} - Jury Voting`;
    
    // Generate all jury votes upfront
    const juryVotesData = semiFinalCountries.map(votingCountry => ({
        country: votingCountry,
        votes: generateJuryVotes(votingCountry, semiFinalCountries)
    }));
    
    // Store for later use
    localStorage.setItem(`semiFinal${semiFinalNumber}JuryVotesData`, JSON.stringify(juryVotesData));
    
    // Initialize standings tracking
    const countryPoints = {};
    semiFinalCountries.forEach(country => {
        countryPoints[country.code] = 0;
    });
    
    let currentIndex = 0;
    let animationTimeout = null;
    let isSkipped = false;
    
    // Function to calculate and display current standings
    function updateLiveStandings() {
        // Create standings array from current points
        const currentStandings = semiFinalCountries.map(country => ({
            country: country,
            totalPoints: countryPoints[country.code]
        }));
        
        // Sort by total points (descending)
        currentStandings.sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) {
                return b.totalPoints - a.totalPoints;
            }
            // Tie-breaker: alphabetical by country code
            return a.country.code.localeCompare(b.country.code);
        });
        
        // Display in table
        const tableBody = document.getElementById('liveStandingsTableBody');
        tableBody.innerHTML = '';
        
        currentStandings.forEach((entry, index) => {
            const row = document.createElement('tr');
            
            // Highlight user's country
            if (entry.country.code === songEntry.country.code) {
                row.className = 'user-country-row';
            }
            
            // Medal emojis for top 3
            let rankDisplay = index + 1;
            if (index === 0 && entry.totalPoints > 0) rankDisplay = '🥇 1';
            else if (index === 1 && entry.totalPoints > 0) rankDisplay = '🥈 2';
            else if (index === 2 && entry.totalPoints > 0) rankDisplay = '🥉 3';
            
            row.innerHTML = `
                <td class="rank-cell">${rankDisplay}</td>
                <td class="country-cell">
                    <span class="country-flag-large">${entry.country.flag}</span>
                    <span class="country-name-cell">${entry.country.name}</span>
                </td>
                <td class="points-cell"><strong>${entry.totalPoints}</strong></td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // Function to display current country's votes
    function displayCountryVotes(index) {
        if (isSkipped || index >= juryVotesData.length) {
            // Animation complete, show standings
            const storedData = JSON.parse(localStorage.getItem(`semiFinal${semiFinalNumber}JuryVotesData`));
            const standings = calculateSemiFinalStandingsFromJuryVotes(semiFinalCountries, storedData);
            showSemiFinalStandings(semiFinalNumber, songEntry, standings);
            return;
        }
        
        const votingData = juryVotesData[index];
        const votingCountry = votingData.country;
        const votes = votingData.votes;
        
        // Update header
        document.getElementById('votingCountryName').textContent = `${votingCountry.flag} ${votingCountry.name}`;
        document.getElementById('votingCountrySubtitle').textContent = 'is giving their points...';
        
        // Update progress
        const progress = ((index + 1) / juryVotesData.length) * 100;
        document.getElementById('votingProgressFill').style.width = `${progress}%`;
        document.getElementById('votingProgressText').textContent = `Country ${index + 1} of ${juryVotesData.length}`;
        
        // Display points (sorted by point value: 12, 10, 8, 6, 5, 4, 2, 1)
        const pointsDisplay = document.getElementById('juryPointsDisplay');
        pointsDisplay.innerHTML = '';
        
        const pointsOrder = [12, 10, 8, 6, 5, 4, 2, 1];
        const sortedVotes = [];
        
        pointsOrder.forEach(pointValue => {
            const countryCode = Object.keys(votes).find(code => votes[code] === pointValue);
            if (countryCode) {
                const country = semiFinalCountries.find(c => c.code === countryCode);
                if (country) {
                    sortedVotes.push({ country, points: pointValue });
                }
            }
        });
        
        sortedVotes.forEach((vote, voteIndex) => {
            const voteCard = document.createElement('div');
            voteCard.className = 'jury-vote-card';
            voteCard.style.animationDelay = `${voteIndex * 0.2}s`;
            voteCard.innerHTML = `
                <div class="jury-vote-points">${vote.points} points</div>
                <div class="jury-vote-flag">${vote.country.flag}</div>
                <div class="jury-vote-country">${vote.country.name}</div>
            `;
            pointsDisplay.appendChild(voteCard);
        });
        
        // Add votes to current standings
        Object.keys(votes).forEach(receivingCountryCode => {
            const points = votes[receivingCountryCode];
            if (countryPoints.hasOwnProperty(receivingCountryCode)) {
                countryPoints[receivingCountryCode] += points;
            }
        });
        
        // Update live standings after a short delay to show the votes first
        setTimeout(() => {
            updateLiveStandings();
        }, 1500);
        
        // Move to next country after delay
        currentIndex = index + 1;
        animationTimeout = setTimeout(() => {
            displayCountryVotes(currentIndex);
        }, 6000); // 6 seconds per country
    }
    
    // Skip button functionality
    const skipBtn = document.getElementById('skipJuryVotingBtn');
    skipBtn.onclick = () => {
        isSkipped = true;
        if (animationTimeout) {
            clearTimeout(animationTimeout);
        }
        const storedData = JSON.parse(localStorage.getItem(`semiFinal${semiFinalNumber}JuryVotesData`));
        const standings = calculateSemiFinalStandingsFromJuryVotes(semiFinalCountries, storedData);
        showSemiFinalStandings(semiFinalNumber, songEntry, standings);
    };
    
    // Initialize live standings (all at 0)
    updateLiveStandings();
    
    // Start animation
    displayCountryVotes(0);
}

// Show jury voting animation
function showJuryVotingAnimation(songEntry, allParticipants) {
    // Hide all screens
    document.getElementById('countrySelectionScreen').style.display = 'none';
    document.getElementById('songDetailsScreen').style.display = 'none';
    document.getElementById('semiFinal1Screen').style.display = 'none';
    document.getElementById('semiFinal2Screen').style.display = 'none';
    document.getElementById('semiFinal1StandingsScreen').style.display = 'none';
    document.getElementById('semiFinal2StandingsScreen').style.display = 'none';
    document.getElementById('finalDrawScreen').style.display = 'none';
    document.getElementById('grandFinalScreen').style.display = 'none';
    document.getElementById('finalStandingsScreen').style.display = 'none';
    document.getElementById('combinedResultsScreen').style.display = 'none';
    document.getElementById('juryVotingAnimationScreen').style.display = 'block';
    
    // Update subtitle to show it's the Grand Final
    document.querySelector('#juryVotingAnimationScreen .subtitle').textContent = 'Grand Final - Jury Voting';
    
    // Generate all jury votes upfront
    const juryVotesData = allParticipants.map(votingCountry => ({
        country: votingCountry,
        votes: generateJuryVotes(votingCountry, allParticipants)
    }));
    
    // Store for later use
    localStorage.setItem('juryVotesData', JSON.stringify(juryVotesData));
    
    // Initialize standings tracking
    const countryPoints = {};
    allParticipants.forEach(country => {
        countryPoints[country.code] = 0;
    });
    
    let currentIndex = 0;
    let animationTimeout = null;
    let isSkipped = false;
    
    // Function to calculate and display current standings
    function updateLiveStandings() {
        // Create standings array from current points
        const currentStandings = allParticipants.map(country => ({
            country: country,
            totalPoints: countryPoints[country.code]
        }));
        
        // Sort by total points (descending)
        currentStandings.sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) {
                return b.totalPoints - a.totalPoints;
            }
            // Tie-breaker: alphabetical by country code
            return a.country.code.localeCompare(b.country.code);
        });
        
        // Display in table
        const tableBody = document.getElementById('liveStandingsTableBody');
        tableBody.innerHTML = '';
        
        currentStandings.forEach((entry, index) => {
            const row = document.createElement('tr');
            
            // Highlight user's country
            if (entry.country.code === songEntry.country.code) {
                row.className = 'user-country-row';
            }
            
            // Medal emojis for top 3
            let rankDisplay = index + 1;
            if (index === 0 && entry.totalPoints > 0) rankDisplay = '🥇 1';
            else if (index === 1 && entry.totalPoints > 0) rankDisplay = '🥈 2';
            else if (index === 2 && entry.totalPoints > 0) rankDisplay = '🥉 3';
            
            row.innerHTML = `
                <td class="rank-cell">${rankDisplay}</td>
                <td class="country-cell">
                    <span class="country-flag-large">${entry.country.flag}</span>
                    <span class="country-name-cell">${entry.country.name}</span>
                </td>
                <td class="points-cell"><strong>${entry.totalPoints}</strong></td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // Function to display current country's votes
    function displayCountryVotes(index) {
        if (isSkipped || index >= juryVotesData.length) {
            // Animation complete, show standings
            const storedData = JSON.parse(localStorage.getItem('juryVotesData'));
            const standings = calculateFinalStandings(allParticipants, storedData);
            showFinalStandings(songEntry, allParticipants, standings);
            return;
        }
        
        const votingData = juryVotesData[index];
        const votingCountry = votingData.country;
        const votes = votingData.votes;
        
        // Update header
        document.getElementById('votingCountryName').textContent = `${votingCountry.flag} ${votingCountry.name}`;
        document.getElementById('votingCountrySubtitle').textContent = 'is giving their points...';
        
        // Update progress
        const progress = ((index + 1) / juryVotesData.length) * 100;
        document.getElementById('votingProgressFill').style.width = `${progress}%`;
        document.getElementById('votingProgressText').textContent = `Country ${index + 1} of ${juryVotesData.length}`;
        
        // Display points (sorted by point value: 12, 10, 8, 6, 5, 4, 2, 1)
        const pointsDisplay = document.getElementById('juryPointsDisplay');
        pointsDisplay.innerHTML = '';
        
        const pointsOrder = [12, 10, 8, 6, 5, 4, 2, 1];
        const sortedVotes = [];
        
        pointsOrder.forEach(pointValue => {
            const countryCode = Object.keys(votes).find(code => votes[code] === pointValue);
            if (countryCode) {
                const country = allParticipants.find(c => c.code === countryCode);
                if (country) {
                    sortedVotes.push({ country, points: pointValue });
                }
            }
        });
        
        sortedVotes.forEach((vote, voteIndex) => {
            const voteCard = document.createElement('div');
            voteCard.className = 'jury-vote-card';
            voteCard.style.animationDelay = `${voteIndex * 0.2}s`;
            voteCard.innerHTML = `
                <div class="jury-vote-points">${vote.points} points</div>
                <div class="jury-vote-flag">${vote.country.flag}</div>
                <div class="jury-vote-country">${vote.country.name}</div>
            `;
            pointsDisplay.appendChild(voteCard);
        });
        
        // Add votes to current standings
        Object.keys(votes).forEach(receivingCountryCode => {
            const points = votes[receivingCountryCode];
            countryPoints[receivingCountryCode] += points;
        });
        
        // Update live standings after a short delay to show the votes first
        setTimeout(() => {
            updateLiveStandings();
        }, 1500);
        
        // Move to next country after delay
        currentIndex = index + 1;
        animationTimeout = setTimeout(() => {
            displayCountryVotes(currentIndex);
        }, 6000); // 6 seconds per country (slower)
    }
    
    // Skip button functionality
    const skipBtn = document.getElementById('skipJuryVotingBtn');
    skipBtn.onclick = () => {
        isSkipped = true;
        if (animationTimeout) {
            clearTimeout(animationTimeout);
        }
        const storedData = JSON.parse(localStorage.getItem('juryVotesData'));
        const standings = calculateFinalStandings(allParticipants, storedData);
        showFinalStandings(songEntry, allParticipants, standings);
    };
    
    // Initialize live standings (all at 0)
    updateLiveStandings();
    
    // Start animation
    displayCountryVotes(0);
}

// Sort standings data
function sortStandings(standings, sortBy, sortOrder, originalStandings = null) {
    const sorted = [...standings];
    
    // Store original indices for rank sorting
    const originalIndices = new Map();
    const referenceStandings = originalStandings || standings;
    referenceStandings.forEach((entry, idx) => {
        originalIndices.set(entry, idx);
    });
    
    sorted.sort((a, b) => {
        let aValue, bValue;
        
        switch(sortBy) {
            case 'rank':
            case 'place':
                // Sort by original rank/index
                aValue = originalIndices.get(a);
                bValue = originalIndices.get(b);
                break;
            case 'jury':
                // For jury sorting, use juryPoints if available, otherwise totalPoints (for final standings)
                aValue = a.juryPoints !== undefined ? a.juryPoints : (a.totalPoints || a.points || 0);
                bValue = b.juryPoints !== undefined ? b.juryPoints : (b.totalPoints || b.points || 0);
                break;
            case 'public':
            case 'publicVotePoints':
                aValue = a.publicVotePoints || 0;
                bValue = b.publicVotePoints || 0;
                break;
            case 'total':
            case 'totalPoints':
                // For total sorting, use totalPoints (combined jury + public)
                aValue = a.totalPoints || 0;
                bValue = b.totalPoints || 0;
                break;
            default:
                return 0;
        }
        
        if (sortOrder === 'asc') {
            return aValue - bValue;
        } else {
            return bValue - aValue;
        }
    });
    
    return sorted;
}

// Render standings table rows
function renderStandingsTableRows(tableBody, standings, songEntry, tableType = 'final') {
    tableBody.innerHTML = '';
    
    standings.forEach((entry, index) => {
        const row = document.createElement('tr');
        
        // Highlight user's country
        if (songEntry && entry.country.code === songEntry.country.code) {
            row.className = 'user-country-row';
        }
        
        // Medal emojis for top 3
        let rankDisplay = index + 1;
        if (index === 0) rankDisplay = '🥇 1';
        else if (index === 1) rankDisplay = '🥈 2';
        else if (index === 2) rankDisplay = '🥉 3';
        
        if (tableType === 'combined') {
        row.innerHTML = `
            <td class="rank-cell">${rankDisplay}</td>
            <td class="country-cell">
                <span class="country-flag-large">${entry.country.flag}</span>
                <span class="country-name-cell">${entry.country.name}</span>
            </td>
            <td class="points-cell"><strong>${entry.totalPoints}</strong></td>
                <td class="jury-points-cell">${entry.juryPoints}</td>
                <td class="public-points-cell">${entry.publicVotePoints}</td>
            <td class="vote-cell">${entry.breakdown[12]}</td>
            <td class="vote-cell">${entry.breakdown[10]}</td>
            <td class="vote-cell">${entry.breakdown[8]}</td>
            <td class="vote-cell">${entry.breakdown[6]}</td>
            <td class="vote-cell">${entry.breakdown[5]}</td>
            <td class="vote-cell">${entry.breakdown[4]}</td>
            <td class="vote-cell">${entry.breakdown[2]}</td>
            <td class="vote-cell">${entry.breakdown[1]}</td>
        `;
        } else if (tableType === 'final') {
            row.innerHTML = `
                <td class="rank-cell">${rankDisplay}</td>
                <td class="country-cell">
                    <span class="country-flag-large">${entry.country.flag}</span>
                    <span class="country-name-cell">${entry.country.name}</span>
                </td>
                <td class="points-cell"><strong>${entry.totalPoints}</strong></td>
                <td class="vote-cell">${entry.breakdown[12]}</td>
                <td class="vote-cell">${entry.breakdown[10]}</td>
                <td class="vote-cell">${entry.breakdown[8]}</td>
                <td class="vote-cell">${entry.breakdown[6]}</td>
                <td class="vote-cell">${entry.breakdown[5]}</td>
                <td class="vote-cell">${entry.breakdown[4]}</td>
                <td class="vote-cell">${entry.breakdown[2]}</td>
                <td class="vote-cell">${entry.breakdown[1]}</td>
            `;
        } else if (tableType === 'semi') {
            const points = entry.points || entry.totalPoints || entry.juryPoints || 0;
            row.innerHTML = `
                <td class="rank-cell">${rankDisplay}</td>
                <td class="country-cell">
                    <span class="country-flag-large">${entry.country.flag}</span>
                    <span class="country-name-cell">${entry.country.name}</span>
                </td>
                <td class="points-cell"><strong>${points}</strong></td>
            `;
        }
        
        tableBody.appendChild(row);
    });
}

// Setup sortable table headers for qualifiers results
function setupQualifiersSortableTable(tableId, results) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const thead = table.querySelector('thead');
    const tbody = document.getElementById('internalResultsTableBody');
    if (!thead || !tbody) return;
    
    let currentSort = { column: null, order: 'desc' };
    const originalResults = [...results];
    
    const headers = thead.querySelectorAll('th');
    headers.forEach((header, index) => {
        const headerText = header.textContent.trim();
        let sortKey = null;
        
        // Determine sort key based on header text
        if (headerText.includes('Rank') || headerText.includes('Place')) {
            sortKey = 'rank';
        } else if (headerText.includes('Jury')) {
            sortKey = 'jury';
        } else if (headerText.includes('Public')) {
            sortKey = 'public';
        } else if (headerText.includes('Total')) {
            sortKey = 'total';
        }
        
        if (sortKey) {
            header.classList.add('sortable');
            header.innerHTML = `${headerText}<span class="sort-indicator"></span>`;
            
            header.addEventListener('click', () => {
                // Toggle sort order if clicking same column, otherwise set to desc
                if (currentSort.column === sortKey) {
                    currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.column = sortKey;
                    currentSort.order = 'desc';
                }
                
                // Remove sort classes from all headers
                headers.forEach(h => {
                    h.classList.remove('sort-asc', 'sort-desc');
                });
                
                // Add sort class to current header
                header.classList.add(`sort-${currentSort.order}`);
                
                // Sort results
                const sorted = sortQualifiersResults(originalResults, currentSort.column, currentSort.order);
                
                // Re-render table
                renderQualifiersResultsTable(tbody, sorted);
            });
        }
    });
}

// Sort qualifiers results
function sortQualifiersResults(results, sortBy, sortOrder) {
    const sorted = [...results];
    
    sorted.sort((a, b) => {
        let aValue, bValue;
        
        switch(sortBy) {
            case 'rank':
            case 'place':
                // Use sortedRank (original position after sorting by total points)
                aValue = a.sortedRank !== undefined ? a.sortedRank : 0;
                bValue = b.sortedRank !== undefined ? b.sortedRank : 0;
                break;
            case 'jury':
                aValue = a.juryPoints || 0;
                bValue = b.juryPoints || 0;
                break;
            case 'public':
                aValue = a.publicPoints || 0;
                bValue = b.publicPoints || 0;
                break;
            case 'total':
                aValue = a.totalPoints || 0;
                bValue = b.totalPoints || 0;
                break;
            default:
                return 0;
        }
        
        if (sortOrder === 'asc') {
            return aValue - bValue;
        } else {
            return bValue - aValue;
        }
    });
    
    return sorted;
}

// Render qualifiers results table rows
function renderQualifiersResultsTable(tbody, results) {
    tbody.innerHTML = '';
    
    results.forEach((result, index) => {
        // Use sortedRank for display (original ranking by total points)
        const displayRank = result.sortedRank !== undefined ? result.sortedRank : index;
        const isWinner = displayRank === 0;
        
        const row = document.createElement('tr');
        if (isWinner) {
            row.className = 'winner-row';
        }
        row.setAttribute('data-rank', displayRank);
        
        let rankDisplay = displayRank + 1;
        if (displayRank === 0) rankDisplay = '🥇';
        else if (displayRank === 1) rankDisplay = '🥈';
        else if (displayRank === 2) rankDisplay = '🥉';
        else rankDisplay = displayRank + 1;
        
        row.innerHTML = `
            <td>${rankDisplay}</td>
            <td><strong>"${result.song.name}"</strong></td>
            <td>${result.song.artist}</td>
            <td><strong>${result.juryPoints}</strong></td>
            <td>${result.publicPoints}</td>
            <td><strong>${result.totalPoints}</strong></td>
        `;
        
        tbody.appendChild(row);
    });
}

// Setup sortable table headers
function setupSortableTable(tableId, standings, songEntry, tableType = 'final') {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    if (!thead || !tbody) return;
    
    let currentSort = { column: null, order: 'desc' };
    const originalStandings = [...standings];
    
    const headers = thead.querySelectorAll('th');
    headers.forEach((header, index) => {
        const headerText = header.textContent.trim();
        let sortKey = null;
        
        // Determine sort key based on header text
        if (headerText.includes('Rank') || headerText.includes('Place')) {
            sortKey = 'rank';
        } else if (headerText.includes('Jury')) {
            sortKey = 'jury';
        } else if (headerText.includes('Public')) {
            sortKey = 'public';
        } else if (headerText.includes('Total') && !headerText.includes('Points')) {
            sortKey = 'total';
        } else if (headerText.includes('Total Points') && tableType === 'final') {
            sortKey = 'jury'; // For final standings, "Total Points" means jury points
        } else if (headerText.includes('Points') && tableType === 'semi') {
            sortKey = 'jury'; // For semi-finals, "Points" means jury points
        }
        
        if (sortKey) {
            header.classList.add('sortable');
            header.innerHTML = `${headerText}<span class="sort-indicator"></span>`;
            
            header.addEventListener('click', () => {
                // Toggle sort order if clicking same column, otherwise set to desc
                if (currentSort.column === sortKey) {
                    currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.column = sortKey;
                    currentSort.order = 'desc';
                }
                
                // Remove sort classes from all headers
                headers.forEach(h => {
                    h.classList.remove('sort-asc', 'sort-desc');
                });
                
                // Add sort class to current header
                header.classList.add(`sort-${currentSort.order}`);
                
                // Sort standings - always use original standings as source
                const sorted = sortStandings(originalStandings, currentSort.column, currentSort.order, originalStandings);
                
                // Re-render table
                renderStandingsTableRows(tbody, sorted, songEntry, tableType);
            });
        }
    });
}

// Show Final Standings screen with jury voting results
function showFinalStandings(songEntry, allParticipants, preCalculatedStandings = null) {
    // Hide all screens
    document.getElementById('countrySelectionScreen').style.display = 'none';
    document.getElementById('songDetailsScreen').style.display = 'none';
    document.getElementById('semiFinal1Screen').style.display = 'none';
    document.getElementById('semiFinal2Screen').style.display = 'none';
    document.getElementById('semiFinal1StandingsScreen').style.display = 'none';
    document.getElementById('semiFinal2StandingsScreen').style.display = 'none';
    document.getElementById('finalDrawScreen').style.display = 'none';
    document.getElementById('grandFinalScreen').style.display = 'none';
    document.getElementById('juryVotingAnimationScreen').style.display = 'none';
    document.getElementById('combinedResultsScreen').style.display = 'none';
    document.getElementById('finalStandingsScreen').style.display = 'block';
    
    // Use pre-calculated standings if provided, otherwise calculate
    const standings = preCalculatedStandings || calculateFinalStandings(allParticipants);
    
    // Display standings table
    const tableBody = document.getElementById('standingsTableBody');
    renderStandingsTableRows(tableBody, standings, songEntry, 'final');
    
    // Setup sortable headers
    setupSortableTable('standingsTable', standings, songEntry, 'final');
    
    // Display user's entry with their ranking
    const userStanding = standings.findIndex(s => s.country.code === songEntry.country.code);
    const userEntry = standings[userStanding];
    
    if (userEntry) {
        const standingsUserCard = document.getElementById('standingsUserQualifierCard');
        let rankDisplay = userStanding + 1;
        if (userStanding === 0) rankDisplay = '🥇 1st Place';
        else if (userStanding === 1) rankDisplay = '🥈 2nd Place';
        else if (userStanding === 2) rankDisplay = '🥉 3rd Place';
        else {
            const suffix = ['th', 'st', 'nd', 'rd'][((userStanding + 1) % 100 - 10) % 10] || 'th';
            rankDisplay = `${userStanding + 1}${suffix} Place`;
        }
        
        standingsUserCard.innerHTML = `
            <div class="user-qualifier-content">
                <div class="user-qualifier-flag">${songEntry.country.flag}</div>
                <div class="user-qualifier-info">
                    <div class="user-qualifier-country">${songEntry.country.name}</div>
                    <div class="user-qualifier-song">"${songEntry.songName}"</div>
                    <div class="user-qualifier-artist">by ${songEntry.artistName}</div>
                    <div style="margin-top: 10px; font-size: 1.2rem; font-weight: bold;">
                        Final Ranking: ${rankDisplay}
                    </div>
                    <div style="margin-top: 5px; font-size: 1.1rem;">
                        Total Points: ${userEntry.totalPoints}
                    </div>
                </div>
                <div class="user-qualifier-badge">${rankDisplay}</div>
            </div>
        `;
        
        // Color based on ranking
        if (userStanding === 0) {
            standingsUserCard.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)';
        } else if (userStanding === 1) {
            standingsUserCard.style.background = 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)';
        } else if (userStanding === 2) {
            standingsUserCard.style.background = 'linear-gradient(135deg, #cd7f32 0%, #e6a85c 100%)';
        } else if (userStanding < 10) {
            standingsUserCard.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        } else {
            standingsUserCard.style.background = 'linear-gradient(135deg, #999 0%, #bbb 100%)';
        }
    }
    
    // Store standings for public vote calculation
    localStorage.setItem('juryStandings', JSON.stringify(standings));
    localStorage.setItem('allParticipants', JSON.stringify(allParticipants));
    
    // Set up button to show public vote
    const showPublicVoteBtn = document.getElementById('showPublicVoteBtn');
    if (showPublicVoteBtn) {
        showPublicVoteBtn.onclick = () => showCombinedResults(songEntry, standings, allParticipants);
    }
}

// Generate public vote points for each country
function generatePublicVotePoints(standings) {
    // Find the highest jury score
    const highestJuryScore = Math.max(...standings.map(s => s.totalPoints));
    const maxPublicVotePoints = highestJuryScore + 10;
    
    // Generate random public vote points for each country (0 to maxPublicVotePoints)
    const publicVotePoints = {};
    standings.forEach(entry => {
        // Random integer between 0 and maxPublicVotePoints (inclusive)
        publicVotePoints[entry.country.code] = Math.floor(Math.random() * (maxPublicVotePoints + 1));
    });
    
    return publicVotePoints;
}

// Show Combined Results screen with Jury + Public Vote
function showCombinedResults(songEntry, juryStandings, allParticipants) {
    // Hide all screens
    document.getElementById('countrySelectionScreen').style.display = 'none';
    document.getElementById('songDetailsScreen').style.display = 'none';
    document.getElementById('semiFinal1Screen').style.display = 'none';
    document.getElementById('semiFinal2Screen').style.display = 'none';
    document.getElementById('semiFinal1StandingsScreen').style.display = 'none';
    document.getElementById('semiFinal2StandingsScreen').style.display = 'none';
    document.getElementById('finalDrawScreen').style.display = 'none';
    document.getElementById('grandFinalScreen').style.display = 'none';
    document.getElementById('finalStandingsScreen').style.display = 'none';
    document.getElementById('combinedResultsScreen').style.display = 'block';
    
    // Generate public vote points
    const publicVotePoints = generatePublicVotePoints(juryStandings);
    
    // Create combined standings
    const combinedStandings = juryStandings.map(entry => ({
        country: entry.country,
        juryPoints: entry.totalPoints,
        publicVotePoints: publicVotePoints[entry.country.code],
        totalPoints: entry.totalPoints + publicVotePoints[entry.country.code],
        breakdown: entry.breakdown
    }));
    
    // Sort by total points (descending)
    combinedStandings.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
        }
        // Tie-breaker: highest public vote, then jury points
        if (b.publicVotePoints !== a.publicVotePoints) {
            return b.publicVotePoints - a.publicVotePoints;
        }
        return b.juryPoints - a.juryPoints;
    });
    
    // Display combined standings table
    const tableBody = document.getElementById('combinedStandingsTableBody');
    renderStandingsTableRows(tableBody, combinedStandings, songEntry, 'combined');
    
    // Setup sortable headers
    setupSortableTable('combinedStandingsTable', combinedStandings, songEntry, 'combined');
    
    // Display user's entry with their final ranking
    const userStanding = combinedStandings.findIndex(s => s.country.code === songEntry.country.code);
    const userEntry = combinedStandings[userStanding];
    
    if (userEntry) {
        const combinedUserCard = document.getElementById('combinedResultsUserQualifierCard');
        let rankDisplay = userStanding + 1;
        if (userStanding === 0) rankDisplay = '🥇 1st Place';
        else if (userStanding === 1) rankDisplay = '🥈 2nd Place';
        else if (userStanding === 2) rankDisplay = '🥉 3rd Place';
        else {
            const suffix = ['th', 'st', 'nd', 'rd'][((userStanding + 1) % 100 - 10) % 10] || 'th';
            rankDisplay = `${userStanding + 1}${suffix} Place`;
        }
        
        combinedUserCard.innerHTML = `
            <div class="user-qualifier-content">
                <div class="user-qualifier-flag">${songEntry.country.flag}</div>
                <div class="user-qualifier-info">
                    <div class="user-qualifier-country">${songEntry.country.name}</div>
                    <div class="user-qualifier-song">"${songEntry.songName}"</div>
                    <div class="user-qualifier-artist">by ${songEntry.artistName}</div>
                    <div style="margin-top: 10px; font-size: 1.2rem; font-weight: bold;">
                        Final Ranking: ${rankDisplay}
                    </div>
                    <div style="margin-top: 5px; font-size: 1.1rem;">
                        Total Points: ${userEntry.totalPoints} (Jury: ${userEntry.juryPoints} + Public: ${userEntry.publicVotePoints})
                    </div>
                </div>
                <div class="user-qualifier-badge">${rankDisplay}</div>
            </div>
        `;
        
        // Color based on ranking
        if (userStanding === 0) {
            combinedUserCard.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)';
        } else if (userStanding === 1) {
            combinedUserCard.style.background = 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)';
        } else if (userStanding === 2) {
            combinedUserCard.style.background = 'linear-gradient(135deg, #cd7f32 0%, #e6a85c 100%)';
        } else if (userStanding < 10) {
            combinedUserCard.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        } else {
            combinedUserCard.style.background = 'linear-gradient(135deg, #999 0%, #bbb 100%)';
        }
    }
}

// Go back to country selection
function goBackToCountrySelection() {
    document.getElementById('songDetailsScreen').style.display = 'none';
    document.getElementById('semiFinal1Screen').style.display = 'none';
    document.getElementById('semiFinal2Screen').style.display = 'none';
    document.getElementById('semiFinal1StandingsScreen').style.display = 'none';
    document.getElementById('semiFinal2StandingsScreen').style.display = 'none';
    document.getElementById('finalDrawScreen').style.display = 'none';
    document.getElementById('grandFinalScreen').style.display = 'none';
    document.getElementById('juryVotingAnimationScreen').style.display = 'none';
    document.getElementById('finalStandingsScreen').style.display = 'none';
    document.getElementById('combinedResultsScreen').style.display = 'none';
    document.getElementById('countrySelectionScreen').style.display = 'block';
    
    // Reset form
    document.getElementById('songForm').reset();
    selectedStyle = null;
    
    // Clear style selections
    document.querySelectorAll('.style-option').forEach(option => {
        option.classList.remove('selected');
    });
}

// Switch between 2025 and 2026 countries
function switchYear() {
    const titleEl = document.querySelector('#countrySelectionScreen .country-select-header .title');
    if (currentYear === 2026) {
        // Switch to 2025
        countries = [...countries2025];
        currentYear = 2025;
        document.getElementById('yearSwitchBtn').textContent = 'Set forward to 2026';
        if (titleEl) titleEl.textContent = 'Eurovision Simulator 2025';
        document.title = 'Eurovision Simulator 2025 - Country Selection';
    } else {
        // Switch to 2026
        countries = [...countries2026];
        currentYear = 2026;
        document.getElementById('yearSwitchBtn').textContent = 'Set back to 2025';
        if (titleEl) titleEl.textContent = 'Eurovision Simulator 2026';
        document.title = 'Eurovision Simulator 2026 - Country Selection';
    }
    
    // Reset selection and filtered countries
    selectedCountry = null;
    filteredCountries = [...countries];
    document.getElementById('selectedCountry').style.display = 'none';
    document.getElementById('countrySelectionScreen').classList.remove('has-selection');
    document.getElementById('searchInput').value = '';
    
    // Reinitialize the grid
    initializeCountryGrid();
}

// Search functionality
function filterCountries(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    if (term === '') {
        filteredCountries = [...countries];
    } else {
        filteredCountries = countries.filter(country => 
            country.name.toLowerCase().includes(term) ||
            country.code.toLowerCase().includes(term)
        );
    }
    
    // Clear selection if filtered out
    if (selectedCountry && !filteredCountries.find(c => c.code === selectedCountry.code)) {
        const previousCard = document.querySelector(`[data-country-code="${selectedCountry.code}"]`);
        if (previousCard) {
            previousCard.classList.remove('selected');
        }
        selectedCountry = null;
        document.getElementById('selectedCountry').style.display = 'none';
        document.getElementById('countrySelectionScreen').classList.remove('has-selection');
    }
    
    initializeCountryGrid();
    
    // Re-select if still in filtered list
    if (selectedCountry && filteredCountries.find(c => c.code === selectedCountry.code)) {
        const selectedCard = document.querySelector(`[data-country-code="${selectedCountry.code}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeCountryGrid();
    
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        filterCountries(e.target.value);
    });
    
    const confirmBtn = document.getElementById('confirmBtn');
    confirmBtn.addEventListener('click', confirmSelection);
    
    const songForm = document.getElementById('songForm');
    songForm.addEventListener('submit', handleSongFormSubmit);
    
    const backBtn = document.getElementById('backBtn');
    backBtn.addEventListener('click', goBackToCountrySelection);
    
    const yearSwitchBtn = document.getElementById('yearSwitchBtn');
    if (yearSwitchBtn) {
        yearSwitchBtn.addEventListener('click', switchYear);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && selectedCountry && document.getElementById('countrySelectionScreen').style.display !== 'none') {
            e.preventDefault();
            confirmSelection();
        }
    });
    
    // Check if we should show song details screen (if country was already selected)
    const savedCountry = localStorage.getItem('selectedCountry');
    if (savedCountry) {
        try {
            selectedCountry = JSON.parse(savedCountry);
            showSongDetailsScreen();
        } catch (e) {
            console.error('Error parsing saved country:', e);
        }
    }
    
    // Internal Qualifiers Event Listeners
    const qualifiersBtn = document.getElementById('qualifiersBtn');
    if (qualifiersBtn) {
        qualifiersBtn.addEventListener('click', showInternalQualifiers);
    }
    
    const backFromQualifiersBtn = document.getElementById('backFromQualifiersBtn');
    if (backFromQualifiersBtn) {
        backFromQualifiersBtn.addEventListener('click', goBackToCountrySelection);
    }
    
    const addSongBtn = document.getElementById('addSongBtn');
    if (addSongBtn) {
        addSongBtn.addEventListener('click', () => openSongModal());
    }
    
    const cancelSongBtn = document.getElementById('cancelSongBtn');
    if (cancelSongBtn) {
        cancelSongBtn.addEventListener('click', closeSongModal);
    }
    
    const songModalForm = document.getElementById('songModalForm');
    if (songModalForm) {
        songModalForm.addEventListener('submit', handleSongModalSubmit);
    }
    
    // Close modal when clicking outside
    const songModal = document.getElementById('songModal');
    if (songModal) {
        songModal.addEventListener('click', (e) => {
            if (e.target === songModal) {
                closeSongModal();
            }
        });
    }
    
    const startVotingBtn = document.getElementById('startVotingBtn');
    if (startVotingBtn) {
        startVotingBtn.addEventListener('click', startVoting);
    }
    
    const randomSongBtn = document.getElementById('randomSongBtn');
    if (randomSongBtn) {
        randomSongBtn.addEventListener('click', generateRandomSong);
    }
    
    // Load saved internal songs (will reset on page load)
    loadInternalSongs();
});

// Show Internal Qualifiers Screen
function showInternalQualifiers() {
    // Hide all screens
    document.getElementById('countrySelectionScreen').style.display = 'none';
    document.getElementById('songDetailsScreen').style.display = 'none';
    document.getElementById('semiFinal1Screen').style.display = 'none';
    document.getElementById('semiFinal2Screen').style.display = 'none';
    document.getElementById('semiFinal1StandingsScreen').style.display = 'none';
    document.getElementById('semiFinal2StandingsScreen').style.display = 'none';
    document.getElementById('finalDrawScreen').style.display = 'none';
    document.getElementById('grandFinalScreen').style.display = 'none';
    document.getElementById('juryVotingAnimationScreen').style.display = 'none';
    document.getElementById('finalStandingsScreen').style.display = 'none';
    document.getElementById('combinedResultsScreen').style.display = 'none';
    document.getElementById('internalJuryVotingScreen').style.display = 'none';
    document.getElementById('internalQualifiersScreen').style.display = 'block';
    
    // Load and display songs (will reset on page load)
    loadInternalSongs();
    renderSongsList();
    updateVotingSection();
}

// Flag to track if we've already reset on page load
let hasResetOnPageLoad = false;

// Load internal songs from localStorage
function loadInternalSongs() {
    // Only reset on initial page load
    if (!hasResetOnPageLoad) {
        internalSongs = [];
        // Clear localStorage to ensure fresh start on page refresh
        localStorage.removeItem('internalSongs');
        localStorage.removeItem('internalQualifierWinner');
        // Also clear votes
        juryVotes = {};
        publicVotes = {};
        internalQualifierWinner = null;
        hasResetOnPageLoad = true;
    } else {
        // During the session, load from localStorage if available
        const saved = localStorage.getItem('internalSongs');
        if (saved) {
            try {
                internalSongs = JSON.parse(saved);
            } catch (e) {
                console.error('Error parsing saved songs:', e);
                internalSongs = [];
            }
        }
    }
}

// Save internal songs to localStorage
function saveInternalSongs() {
    localStorage.setItem('internalSongs', JSON.stringify(internalSongs));
}

// Generate random song name and artist
function generateRandomSong() {
    if (internalSongs.length >= 14) {
        alert('Maximum 14 songs reached');
        return;
    }
    
    // Song name parts
    const songFirstWords = ['Love', 'Heart', 'Dream', 'Fire', 'Star', 'Moon', 'Light', 'Dark', 'Night', 'Day', 'Sky', 'Ocean', 'River', 'Mountain', 'Wind', 'Rain', 'Sun', 'Dance', 'Sing', 'Fly', 'Run', 'Walk', 'Jump', 'Fall', 'Rise', 'Shine', 'Glow', 'Spark', 'Flame', 'Wave'];
    const songSecondWords = ['Forever', 'Tonight', 'Always', 'Never', 'Again', 'Away', 'Home', 'Free', 'Wild', 'Brave', 'Strong', 'True', 'Real', 'Pure', 'Bright', 'Clear', 'Deep', 'High', 'Low', 'Fast', 'Slow', 'New', 'Old', 'Young', 'Sweet', 'Bitter', 'Cold', 'Warm', 'Hot', 'Cool'];
    const songTitles = ['Song', 'Melody', 'Tune', 'Rhythm', 'Beat', 'Sound', 'Voice', 'Call', 'Cry', 'Whisper', 'Shout', 'Echo', 'Silence', 'Music', 'Harmony', 'Chorus', 'Verse', 'Bridge', 'Refrain', 'Ballad'];
    
    // Artist name parts
    const artistFirstNames = ['Alex', 'Emma', 'Lucas', 'Sofia', 'Noah', 'Olivia', 'Ethan', 'Isabella', 'Mason', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Daniel', 'Harper', 'Matthew', 'Evelyn', 'Aiden', 'Abigail', 'Jackson', 'Emily', 'Logan', 'Elizabeth', 'David', 'Samantha', 'Joseph', 'Ava', 'Samuel', 'Madison'];
    const artistLastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young'];
    const bandNames = ['The Stars', 'The Waves', 'The Flames', 'The Shadows', 'The Lights', 'The Echoes', 'The Voices', 'The Sounds', 'The Beats', 'The Rhythms', 'Midnight', 'Sunset', 'Sunrise', 'Twilight', 'Aurora', 'Nova', 'Comet', 'Meteor', 'Galaxy', 'Nebula'];
    
    // Generate random song name
    let songName;
    const songType = Math.random();
    if (songType < 0.4) {
        // Two word combination
        songName = `${songFirstWords[Math.floor(Math.random() * songFirstWords.length)]} ${songSecondWords[Math.floor(Math.random() * songSecondWords.length)]}`;
    } else if (songType < 0.7) {
        // Word + Title
        songName = `${songFirstWords[Math.floor(Math.random() * songFirstWords.length)]} ${songTitles[Math.floor(Math.random() * songTitles.length)]}`;
    } else {
        // Just a title with "The"
        songName = `The ${songTitles[Math.floor(Math.random() * songTitles.length)]}`;
    }
    
    // Generate random artist name
    let artistName;
    const artistType = Math.random();
    if (artistType < 0.5) {
        // First name + Last name
        artistName = `${artistFirstNames[Math.floor(Math.random() * artistFirstNames.length)]} ${artistLastNames[Math.floor(Math.random() * artistLastNames.length)]}`;
    } else {
        // Band name
        artistName = bandNames[Math.floor(Math.random() * bandNames.length)];
    }
    
    // Add the song
    const song = {
        name: songName,
        artist: artistName
    };
    
    internalSongs.push(song);
    saveInternalSongs();
    renderSongsList();
    updateVotingSection();
}

// Render songs list
function renderSongsList() {
    const songsList = document.getElementById('songsList');
    songsList.innerHTML = '';
    
    if (internalSongs.length === 0) {
        songsList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No songs added yet. Click "Add Song" to get started!</p>';
        return;
    }
    
    internalSongs.forEach((song, index) => {
        const songItem = document.createElement('div');
        songItem.className = 'song-item';
        songItem.innerHTML = `
            <div class="song-item-info">
                <div class="song-item-name">"${song.name}"</div>
                <div class="song-item-artist">by ${song.artist}</div>
            </div>
            <div class="song-item-actions">
                <button class="song-action-btn edit-song-btn" data-index="${index}">Edit</button>
                <button class="song-action-btn delete-song-btn" data-index="${index}">Delete</button>
            </div>
        `;
        
        // Add event listeners
        songItem.querySelector('.edit-song-btn').addEventListener('click', () => editSong(index));
        songItem.querySelector('.delete-song-btn').addEventListener('click', () => deleteSong(index));
        
        songsList.appendChild(songItem);
    });
    
    // Update add button state
    const addSongBtn = document.getElementById('addSongBtn');
    const randomSongBtn = document.getElementById('randomSongBtn');
    
    if (addSongBtn) {
        addSongBtn.disabled = internalSongs.length >= 14;
        if (internalSongs.length >= 14) {
            addSongBtn.textContent = 'Maximum 14 songs reached';
        } else {
            addSongBtn.textContent = '+ Add Song';
        }
    }
    
    if (randomSongBtn) {
        randomSongBtn.disabled = internalSongs.length >= 14;
    }
}

// Open song modal for adding/editing
function openSongModal(index = null) {
    currentEditingIndex = index;
    const modal = document.getElementById('songModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalSongName = document.getElementById('modalSongName');
    const modalArtistName = document.getElementById('modalArtistName');
    const form = document.getElementById('songModalForm');
    
    if (index !== null && internalSongs[index]) {
        // Editing existing song
        modalTitle.textContent = 'Edit Song';
        modalSongName.value = internalSongs[index].name;
        modalArtistName.value = internalSongs[index].artist;
    } else {
        // Adding new song
        modalTitle.textContent = 'Add Song';
        form.reset();
    }
    
    modal.style.display = 'flex';
}

// Close song modal
function closeSongModal() {
    const modal = document.getElementById('songModal');
    modal.style.display = 'none';
    currentEditingIndex = null;
    document.getElementById('songModalForm').reset();
}

// Handle song modal form submission
function handleSongModalSubmit(e) {
    e.preventDefault();
    
    const songName = document.getElementById('modalSongName').value.trim();
    const artistName = document.getElementById('modalArtistName').value.trim();
    
    if (!songName || !artistName) {
        alert('Please fill in both song name and artist name');
        return;
    }
    
    const song = {
        name: songName,
        artist: artistName
    };
    
    if (currentEditingIndex !== null) {
        // Update existing song
        internalSongs[currentEditingIndex] = song;
    } else {
        // Add new song
        if (internalSongs.length >= 14) {
            alert('Maximum 14 songs allowed');
            return;
        }
        internalSongs.push(song);
    }
    
    saveInternalSongs();
    renderSongsList();
    updateVotingSection();
    closeSongModal();
}

// Edit song
function editSong(index) {
    openSongModal(index);
}

// Delete song
function deleteSong(index) {
    if (confirm(`Are you sure you want to delete "${internalSongs[index].name}"?`)) {
        internalSongs.splice(index, 1);
        saveInternalSongs();
        renderSongsList();
        updateVotingSection();
        
        // Clear votes if voting was started
        juryVotes = {};
        publicVotes = {};
    }
}

// Update voting section visibility
function updateVotingSection() {
    const votingSection = document.getElementById('votingSection');
    const resultsSection = document.getElementById('resultsSection');
    
    if (internalSongs.length >= 2) {
        votingSection.style.display = 'block';
    } else {
        votingSection.style.display = 'none';
    }
    
    // Hide results if voting hasn't been completed
    if (resultsSection) {
        const hasResults = Object.keys(juryVotes).length > 0 || Object.keys(publicVotes).length > 0;
        resultsSection.style.display = hasResults ? 'block' : 'none';
    }
}

// Start voting process
function startVoting() {
    if (internalSongs.length < 2) {
        alert('You need at least 2 songs to start voting');
        return;
    }
    
    // Reset votes
    juryVotes = {};
    publicVotes = {};
    internalJuryVotesData = [];
    
    // Show voting interface
    const votingSection = document.getElementById('votingSection');
    votingSection.innerHTML = `
        <h4 class="qualifiers-header">Voting</h4>
        <p>Vote for your favorite song using jury voting. Public voting will be simulated automatically.</p>
        
        <div class="voting-interface">
            <div class="voting-type-section">
                <h5>🎯 Jury Voting</h5>
                <p style="margin-bottom: 15px; color: #666;">Select your favorite song (jury vote):</p>
                <div class="voting-options" id="juryVotingOptions">
                    ${internalSongs.map((song, index) => `
                        <div class="voting-option">
                            <input type="radio" name="juryVote" id="jury${index}" value="${index}" required>
                            <label for="jury${index}" class="voting-option-label">"${song.name}" by ${song.artist}</label>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <button type="button" class="submit-vote-btn" id="submitVoteBtn">Start Jury Voting</button>
        </div>
    `;
    
    // Add submit vote handler
    const submitVoteBtn = document.getElementById('submitVoteBtn');
    submitVoteBtn.addEventListener('click', startInternalJuryVoting);
}

// Start internal jury voting animation
function startInternalJuryVoting() {
    const juryRadio = document.querySelector('input[name="juryVote"]:checked');
    
    if (!juryRadio) {
        alert('Please select your favorite song for jury voting');
        return;
    }
    
    const userJuryIndex = parseInt(juryRadio.value);
    
    // Generate jury members (5 members)
    const jurySize = 5;
    const juryMembers = [];
    
    // Generate Eurovision-style points based on number of songs
    // Points: 12, 10, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, ...
    function getEurovisionPoints(numSongs) {
        const standardPoints = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];
        const points = [];
        for (let i = 0; i < numSongs; i++) {
            points.push(i < standardPoints.length ? standardPoints[i] : 0);
        }
        return points;
    }
    
    const eurovisionPoints = getEurovisionPoints(internalSongs.length);
    
    // Select standout songs (2-4 songs that will consistently rank high)
    // User's song is always a standout, plus 1-3 others
    const numStandouts = Math.min(2 + Math.floor(Math.random() * 3), internalSongs.length); // 2-4 standout songs
    const standoutSongs = new Set([userJuryIndex]);
    
    // Add other standout songs randomly
    while (standoutSongs.size < numStandouts) {
        const randomIndex = Math.floor(Math.random() * internalSongs.length);
        standoutSongs.add(randomIndex);
    }
    
    // Function to create weighted ranking (standout songs more likely to rank higher)
    function createWeightedRanking() {
        const allIndices = [...Array(internalSongs.length).keys()];
        const ranking = [];
        const remaining = [...allIndices];
        
        // Assign positions with weights favoring standout songs
        for (let position = 0; position < internalSongs.length; position++) {
            // Calculate weights: standout songs have much higher chance of being in top positions
            const weights = remaining.map(index => {
                if (standoutSongs.has(index)) {
                    // Standout songs: higher weight for top positions, lower for bottom
                    const positionWeight = position < 5 ? 10 : position < 10 ? 5 : 1;
                    return positionWeight;
                } else {
                    // Non-standout songs: lower weight for top positions, higher for bottom
                    const positionWeight = position < 5 ? 1 : position < 10 ? 3 : 5;
                    return positionWeight;
                }
            });
            
            // Select based on weights
            const totalWeight = weights.reduce((a, b) => a + b, 0);
            let random = Math.random() * totalWeight;
            let selectedIndex = 0;
            
            for (let i = 0; i < weights.length; i++) {
                random -= weights[i];
                if (random <= 0) {
                    selectedIndex = i;
                    break;
                }
            }
            
            ranking.push(remaining[selectedIndex]);
            remaining.splice(selectedIndex, 1);
        }
        
        return ranking;
    }
    
    for (let i = 0; i < jurySize; i++) {
        // Create weighted ranking favoring standout songs
        const ranking = createWeightedRanking();
        
        // Store ranking (will be converted to points later)
        juryMembers.push({
            name: `Jury Member ${i + 1}`,
            ranking: ranking
        });
    }
    
    // Add user's jury vote (user's selected song gets 1st place, rest weighted)
    const userRanking = [userJuryIndex];
    const otherIndices = [...Array(internalSongs.length).keys()].filter(idx => idx !== userJuryIndex);
    
    // Weight the remaining songs (standout songs more likely to be higher)
    const weightedOther = otherIndices.map(idx => ({
        index: idx,
        weight: standoutSongs.has(idx) ? 10 : 1
    }));
    
    // Sort by weight (randomize within same weight)
    weightedOther.sort((a, b) => {
        if (b.weight !== a.weight) return b.weight - a.weight;
        return Math.random() - 0.5;
    });
    
    userRanking.push(...weightedOther.map(item => item.index));
    
    juryMembers.push({
        name: 'Your Vote',
        ranking: userRanking
    });
    
    internalJuryVotesData = juryMembers;
    
    // Hide internal qualifiers screen and show jury voting animation
    document.getElementById('internalQualifiersScreen').style.display = 'none';
    document.getElementById('internalJuryVotingScreen').style.display = 'block';
    
    // Start animation (no user public vote needed)
    showInternalJuryVotingAnimation();
}

// Show internal jury voting animation
function showInternalJuryVotingAnimation() {
    // Initialize points tracking
    const songPoints = {};
    internalSongs.forEach((_, index) => {
        songPoints[index] = 0;
    });
    
    let currentIndex = 0;
    let animationTimeout = null;
    let isSkipped = false;
    
    // Function to update live standings
    function updateInternalLiveStandings() {
        const standings = internalSongs.map((song, index) => ({
            song: song,
            index: index,
            points: songPoints[index] || 0
        }));
        
        standings.sort((a, b) => {
            if (b.points !== a.points) {
                return b.points - a.points;
            }
            return a.index - b.index;
        });
        
        const tableBody = document.getElementById('internalLiveStandingsTableBody');
        tableBody.innerHTML = '';
        
        standings.forEach((entry, rank) => {
            const row = document.createElement('tr');
            let rankDisplay = rank + 1;
            if (rank === 0 && entry.points > 0) rankDisplay = '🥇 1';
            else if (rank === 1 && entry.points > 0) rankDisplay = '🥈 2';
            else if (rank === 2 && entry.points > 0) rankDisplay = '🥉 3';
            
            row.innerHTML = `
                <td class="rank-cell">${rankDisplay}</td>
                <td class="country-cell">
                    <span class="country-name-cell">"${entry.song.name}"<br><small>by ${entry.song.artist}</small></span>
                </td>
                <td class="points-cell"><strong>${entry.points}</strong></td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Function to display jury member votes
    function displayJuryMemberVotes(index) {
        if (isSkipped || index >= internalJuryVotesData.length) {
            // Animation complete, calculate final results
            calculateInternalResults();
            return;
        }
        
        const juryMember = internalJuryVotesData[index];
        const ranking = juryMember.ranking;
        
        // Update header
        document.getElementById('internalJuryMemberName').textContent = juryMember.name;
        document.getElementById('internalJuryMemberSubtitle').textContent = 'is giving their points...';
        
        // Update progress
        const progress = ((index + 1) / internalJuryVotesData.length) * 100;
        document.getElementById('internalVotingProgressFill').style.width = `${progress}%`;
        document.getElementById('internalVotingProgressText').textContent = `${juryMember.name} (${index + 1} of ${internalJuryVotesData.length})`;
        
        // Display points - convert ranking to Eurovision points
        const pointsDisplay = document.getElementById('internalJuryPointsDisplay');
        pointsDisplay.innerHTML = '';
        
        const eurovisionPoints = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];
        const sortedVotes = [];
        
        // Show top songs that receive points
        const maxPointsToShow = Math.min(ranking.length, 10);
        for (let i = 0; i < maxPointsToShow; i++) {
            const songIndex = ranking[i];
            const points = i < eurovisionPoints.length ? eurovisionPoints[i] : 0;
            if (points > 0) {
                const song = internalSongs[songIndex];
                sortedVotes.push({ song, points: points, index: songIndex, rank: i + 1 });
            }
        }
        
        sortedVotes.forEach((vote, voteIndex) => {
            const voteCard = document.createElement('div');
            voteCard.className = 'jury-vote-card';
            voteCard.style.animationDelay = `${voteIndex * 0.2}s`;
            voteCard.innerHTML = `
                <div class="jury-vote-points">${vote.points} points</div>
                <div class="jury-vote-country">"${vote.song.name}"</div>
                <div style="font-size: 0.8rem; opacity: 0.9;">by ${vote.song.artist}</div>
            `;
            pointsDisplay.appendChild(voteCard);
        });
        
        // Add points to standings based on ranking
        ranking.forEach((songIndex, rank) => {
            const points = rank < eurovisionPoints.length ? eurovisionPoints[rank] : 0;
            songPoints[songIndex] = (songPoints[songIndex] || 0) + points;
        });
        
        // Update live standings after delay
        setTimeout(() => {
            updateInternalLiveStandings();
        }, 1500);
        
        // Move to next jury member
        currentIndex = index + 1;
        animationTimeout = setTimeout(() => {
            displayJuryMemberVotes(currentIndex);
        }, 4000); // 4 seconds per jury member
    }
    
    // Skip button
    const skipBtn = document.getElementById('skipInternalJuryVotingBtn');
    skipBtn.onclick = () => {
        isSkipped = true;
        if (animationTimeout) {
            clearTimeout(animationTimeout);
        }
        calculateInternalResults();
    };
    
    // Initialize standings
    updateInternalLiveStandings();
    
    // Start animation
    displayJuryMemberVotes(0);
}

// Calculate internal results with public vote
function calculateInternalResults() {
    // Eurovision points system: 12, 10, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, ...
    const eurovisionPoints = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];
    
    // Calculate actual jury points from each jury member's ranking (not simplified)
    // Each jury member gives points based on their ranking: 12, 10, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, ...
    const juryPoints = {};
    internalSongs.forEach((_, index) => {
        juryPoints[index] = 0;
    });
    
    // For each jury member, convert their ranking to points and add to total
    internalJuryVotesData.forEach(juryMember => {
        if (juryMember.ranking) {
            juryMember.ranking.forEach((songIndex, rank) => {
                // Convert rank (0-based) to Eurovision points
                // Rank 0 = 12 points, Rank 1 = 10 points, etc.
                const points = rank < eurovisionPoints.length ? eurovisionPoints[rank] : 0;
                juryPoints[songIndex] += points;
            });
        }
    });
    
    // Generate public vote points (not simplified - random between 0 and highest jury score)
    const highestJuryScore = Math.max(...Object.values(juryPoints));
    const maxPublicVotePoints = highestJuryScore;
    
    const publicPoints = {};
    internalSongs.forEach((_, index) => {
        // Random integer between 0 and maxPublicVotePoints (inclusive)
        publicPoints[index] = Math.floor(Math.random() * (maxPublicVotePoints + 1));
    });
    
    // Store votes
    juryVotes = juryPoints;
    publicVotes = publicPoints;
    
    // Hide jury voting screen and show results
    document.getElementById('internalJuryVotingScreen').style.display = 'none';
    document.getElementById('internalQualifiersScreen').style.display = 'block';
    
    // Calculate and display results
    calculateAndDisplayResults();
}

// Calculate and display results
function calculateAndDisplayResults() {
    // Calculate total points for each song
    const results = internalSongs.map((song, index) => {
        const juryPoints = juryVotes[index] || 0;
        const publicPoints = publicVotes[index] || 0;
        const totalPoints = juryPoints + publicPoints;
        
        return {
            song: song,
            index: index,
            juryPoints: juryPoints,
            publicPoints: publicPoints,
            totalPoints: totalPoints
        };
    });
    
    // Store original rank before sorting
    results.forEach((result, index) => {
        result.originalRank = index;
    });
    
    // Sort by total points (descending)
    results.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
        }
        // Tie-breaker: public vote
        return b.publicPoints - a.publicPoints;
    });
    
    // Store original sorted order for rank sorting
    results.forEach((result, index) => {
        result.sortedRank = index;
    });
    
    // Store winner
    const winner = results[0];
    internalQualifierWinner = {
        songName: winner.song.name,
        artistName: winner.song.artist,
        juryPoints: winner.juryPoints,
        publicPoints: winner.publicPoints,
        totalPoints: winner.totalPoints
    };
    localStorage.setItem('internalQualifierWinner', JSON.stringify(internalQualifierWinner));
    
    // Display results
    const resultsSection = document.getElementById('resultsSection');
    const resultsTableWrapper = document.getElementById('resultsTableWrapper');
    const useWinnerBtn = document.getElementById('useWinnerBtn');
    
    // Create table with ID for sorting
    resultsTableWrapper.innerHTML = `
        <table class="internal-results-table" id="internalResultsTable">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Song</th>
                    <th>Artist</th>
                    <th>Jury Points</th>
                    <th>Public Points</th>
                    <th>Total Points</th>
                </tr>
            </thead>
            <tbody id="internalResultsTableBody">
            </tbody>
        </table>
    `;
    
    // Render initial table
    const tbody = document.getElementById('internalResultsTableBody');
    renderQualifiersResultsTable(tbody, results);
    
    // Setup sortable headers for qualifiers results table
    setupQualifiersSortableTable('internalResultsTable', results);
    
    resultsSection.style.display = 'block';
    if (useWinnerBtn) {
        useWinnerBtn.style.display = 'block';
        useWinnerBtn.onclick = useWinnerForEntry;
    }
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Use winner for Eurovision entry
function useWinnerForEntry() {
    if (!internalQualifierWinner) {
        alert('No winner available');
        return;
    }
    
    // Get country from localStorage or selectedCountry
    let country = selectedCountry;
    if (!country) {
        const savedCountry = localStorage.getItem('selectedCountry');
        if (savedCountry) {
            try {
                country = JSON.parse(savedCountry);
                selectedCountry = country;
            } catch (e) {
                console.error('Error parsing saved country:', e);
            }
        }
    }
    
    if (!country) {
        alert('Please select a country first. Go back to country selection and choose your country.');
        return;
    }
    
    // Create song entry from winner
    const songEntry = {
        country: country,
        songName: internalQualifierWinner.songName,
        artistName: internalQualifierWinner.artistName,
        style: 'Pop', // Default style, can be customized
        language: 'english',
        tempo: 'medium',
        description: 'Winner of Internal Selection'
    };
    
    // Store in localStorage
    localStorage.setItem('songEntry', JSON.stringify(songEntry));
    localStorage.setItem('selectedCountry', JSON.stringify(country));
    
    // Get qualifier method and navigate to appropriate screen
    const qualifierInfo = getQualifierMethod(country);
    
    // Hide internal qualifiers screen
    document.getElementById('internalQualifiersScreen').style.display = 'none';
    
    // Navigate based on qualifier method
    if (qualifierInfo.method === 'automatic') {
        showFinalDraw(1, songEntry);
    } else {
        showSemiFinalScreen(qualifierInfo.semiFinal, songEntry);
    }
}
