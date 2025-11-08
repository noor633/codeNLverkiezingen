// js.js - Simple voting system
const TESTMODUS = false;
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1436386636413009950/34F39H6aNaRWUsJ-riMg-LXx6GpkFC2yPB-FtE3psltqL1Jk_umBh6hCgrg-NqMCqICt';

/* Storage Functions */
function hasVoted() {
  if(TESTMODUS) return false;
  return localStorage.getItem('heeftGestemd') === '1';
}

function setVoted() {
  localStorage.setItem('heeftGestemd', '1');
}

function clearVoted() {
  localStorage.removeItem('heeftGestemd');
}

/* Warning System */
function showWarning(message) {
  // Create warning container that allows scrolling
  document.body.style.overflow = 'hidden';
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(26, 26, 26, 0.8);
    backdrop-filter: blur(16px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;

  const warning = document.createElement('div');
  warning.style.cssText = `
    background: #242424;
    padding: 24px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.1);
    color: white;
    text-align: center;
    max-width: 400px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    margin: auto;
    position: relative;
    top: 50%;
    transform: translateY(-50%);
  `;

  warning.innerHTML = `
    <h2 style="margin:0 0 16px 0;color:#ff4444">⚠️ Waarschuwing</h2>
    <p style="margin:0 0 20px 0;color:#a0a0a0;line-height:1.5">${message}</p>
    <button style="background:#2c2c2c;border:1px solid rgba(255,255,255,0.1);color:white;padding:8px 24px;border-radius:8px;cursor:pointer">OK</button>
  `;

  warning.querySelector('button').onclick = () => {
    document.body.style.overflow = '';
    overlay.remove();
  };
  document.body.appendChild(overlay);
  overlay.appendChild(warning);
}

/* Voting Functions */
async function sendVote(party) {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🗳️ **Nieuwe Stem**\n> Partij: ${party}`
      })
    });
    return response.ok;
  } catch(e) {
    console.error('Vote error:', e);
    return false;
  }
}

async function handleVote(item) {
  if(!TESTMODUS && hasVoted()) {
    return showWarning('Je hebt al gestemd!');
  }

  const party = item.dataset.party || item.querySelector('.name')?.textContent || item.textContent.trim();
  
  try {
    const success = await sendVote(party);
    if(success) {
      setVoted();
      const confirmEl = document.getElementById('confirmText');
      if(confirmEl) confirmEl.textContent = 'Je stem is geregistreerd! 🎉';
      document.getElementById('voteCard').classList.add('voted');
    } else {
      showWarning('Er ging iets mis met het versturen van je stem. Probeer het later opnieuw.');
    }
  } catch(e) {
    console.error('Vote error:', e);
    showWarning('Er ging iets mis met het versturen van je stem. Probeer het later opnieuw.');
  }
}

/* Initialization */
window.addEventListener('DOMContentLoaded', function() {
  // Check if already voted
  if(!TESTMODUS && hasVoted()) {
    showWarning('Je hebt al gestemd!');
    return;
  }
  
  // Bind click handlers
  document.querySelectorAll('#partyList .item').forEach(item => {
    item.addEventListener('click', () => {
      const party = item.dataset.party || item.querySelector('.name')?.textContent || item.textContent.trim();
      if(confirm(`Wil je stemmen op: ${party}?`)) {
        handleVote(item);
      }
    });
  });
  
  // Show commission message
  setTimeout(() => {
    alert('Let op: Mijn commissions voor websites, bots, scripts en meer zijn open! Stuur een DM voor info.');
    alert('Ik ben ook bezig met een operating systeem maken, als je hier meer info over wilt DM mij ook, het is gefocused op snelheid en privacy!');
    alert('Bij alles anders (digitaal) kan je me ook altijd een DM sturen!');
  }, 500);
});