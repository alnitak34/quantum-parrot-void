const fs = require('fs');
let c = fs.readFileSync('game.html', 'utf8');

const old = "console.log('Run saved', _currentRunId);\n  });";

const newCode = "console.log('Run saved', _currentRunId);\n    if (_currentRunId) {\n      let attempts = 0;\n      const poll = setInterval(() => {\n        attempts++;\n        if (attempts > 24) { clearInterval(poll); return; }\n        _sbClient.from('game_runs')\n          .select('tx_hash')\n          .eq('id', _currentRunId)\n          .single()\n          .then(({ data: d }) => {\n            if (d && typeof d.tx_hash === 'string' && d.tx_hash.startsWith('0x') && d.tx_hash.length >= 66) {\n              clearInterval(poll);\n              _currentTxHash = d.tx_hash;\n              const proof = document.getElementById('dp-proof');\n              if (proof) {\n                proof.href = 'https://monadscan.com/tx/' + d.tx_hash;\n                proof.classList.add('visible');\n              }\n              console.log('tx_hash found:', d.tx_hash);\n            }\n          });\n      }, 5000);\n    }\n  });";

if (c.includes(old)) {
  c = c.replace(old, newCode);
  fs.writeFileSync('game.html', c, 'utf8');
  console.log('Listo. Cambio aplicado.');
} else {
  console.log('ERROR: texto no encontrado en game.html');
}