$file = "game.html"
$content = Get-Content $file -Raw -Encoding UTF8

$old = "console.log('Run saved', _currentRunId);
  });"

$new = "console.log('Run saved', _currentRunId);
    if (_currentRunId) {
      let attempts = 0;
      const poll = setInterval(() => {
        attempts++;
        if (attempts > 24) { clearInterval(poll); return; }
        _sbClient.from('game_runs')
          .select('tx_hash')
          .eq('id', _currentRunId)
          .single()
          .then(({ data: d }) => {
            if (d && typeof d.tx_hash === 'string' && d.tx_hash.startsWith('0x') && d.tx_hash.length >= 66) {
              clearInterval(poll);
              _currentTxHash = d.tx_hash;
              const proof = document.getElementById('dp-proof');
              if (proof) {
                proof.href = 'https://monadscan.com/tx/' + d.tx_hash;
                proof.classList.add('visible');
              }
              console.log('tx_hash found:', d.tx_hash);
            }
          });
      }, 5000);
    }
  });"

$content = $content.Replace($old, $new)
Set-Content $file $content -Encoding UTF8
Write-Host "Listo."