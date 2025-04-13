let savedTracks = [];

async function generatePlaylist() {
  savedTracks = [];
  const prompt = document.getElementById('vibeInput').value;
  const playlistDiv = document.getElementById('playlist');
  const savedListDiv = document.getElementById('savedTracks');
  playlistDiv.innerHTML = `<p>Thinking in vibes…</p>`;
  savedListDiv.innerHTML = "";

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const vibeData = await response.json();
    console.log("🧠 OpenAI vibeData (RAW):", JSON.stringify(vibeData, null, 2));

    playlistDiv.innerHTML = `<h3>Your vibe: "${prompt}"</h3>`;

    if (vibeData.fallback) {
      playlistDiv.innerHTML += `<pre style='white-space: pre-wrap; color: red;'>⚠️ OpenAI fallback: ${vibeData.fallback}</pre>`;
      return;
    }

    if (Array.isArray(vibeData.tracks)) {
      vibeData.tracks.slice(0, 30).forEach((track, index) => {
        const query = encodeURIComponent(`${track.title} ${track.artist}`);
        const link = `https://music.apple.com/us/search?term=${query}`;
        const checkboxId = `saveTrack-${index}`;

        playlistDiv.innerHTML += `
          <div class="track">
            <input type="checkbox" id="${checkboxId}" onchange="toggleSave('${track.title}', '${track.artist}', '${link}', this)">
            <label for="${checkboxId}">
              <strong>${track.title}</strong> by ${track.artist}
            </label><br/>
            <button onclick="window.open('${link}', '_blank')">🎵 Listen</button>
          </div>`;
      });
    }

    const music = await fetch('music.json').then(res => res.json());
    const filtered = music.filter(track => {
      const genreMatch = vibeData.genres?.some(g =>
        track.Genre?.toLowerCase().includes(g.toLowerCase())
      );
      return genreMatch;
    });

    const extraSuggestions = (filtered.length ? filtered : music)
      .sort(() => 0.5 - Math.random())
      .slice(0, 30 - (vibeData.tracks?.length || 0));

    extraSuggestions.forEach(track => {
      playlistDiv.innerHTML += `
        <div class="track">
          <strong>${track.Name}</strong> by ${track.Artist}<br/>
          <em>${track.Album}</em> (${track.Genre})
        </div>`;
    });

  } catch (err) {
    playlistDiv.innerHTML = `<p style='color: red;'>Error generating playlist. Check logs or try again.</p>`;
    console.error("❌ Error in generatePlaylist:", err);
  }
}

function toggleSave(title, artist, link, checkbox) {
  const trackStr = `${title} by ${artist}
${link}`;
  if (checkbox.checked) {
    savedTracks.push(trackStr);
  } else {
    savedTracks = savedTracks.filter(t => t !== trackStr);
  }
  updateSavedList();
}

function updateSavedList() {
  const savedListDiv = document.getElementById('savedTracks');
  if (savedTracks.length === 0) {
    savedListDiv.innerHTML = "";
    return;
  }

  savedListDiv.innerHTML = `
    <h3>✅ Saved Tracks</h3>
    <pre style="white-space: pre-wrap; background: #222; padding: 1em; border-radius: 5px;">${savedTracks.join('

')}</pre>
    <button onclick="copySavedTracks()">📋 Copy to Clipboard</button>
  `;
}

function copySavedTracks() {
  const temp = document.createElement('textarea');
  temp.value = savedTracks.join('\n\n');
  document.body.appendChild(temp);
  temp.select();
  document.execCommand('copy');
  document.body.removeChild(temp);
  alert('Saved tracks copied to clipboard!');
}
