import express from 'express';
import { exec } from 'child_process';
import fs from 'fs';

const app = express();
app.use(express.json());

app.post('/issue', (req, res) => {
  console.time('issue');                                  // ← ① 타이머 시작

  // (1) PowerShell 스크립트 호출
  exec('powershell.exe -File issue.ps1', (err, stdout, stderr) => {
    if (err) {
      console.error('↳ exec error:', err);
      return res.status(500).send(err.message);
    }

    // (2) VC JSON 파일 읽어서 반환
    const vc = fs.readFileSync('output-vc.json', 'utf8');
    res.json(JSON.parse(vc));

    console.timeEnd('issue');                              // ← ② 타이머 종료, ms 단위 로그
  });
});

app.listen(3000, () => console.log('API listening on http://localhost:3000'));
