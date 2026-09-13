/**
 * 맞춤법 검사기 자가 진단.
 *
 *   pnpm --filter blog spellcheck:doctor
 *
 * 에디터의 맞춤법 패널이 비어 있을 때, 문제가 (1) 외부 검사기 쪽인지
 * (2) 우리 코드 쪽인지 가리기 위한 스크립트다. 일부러 틀린 문장을 보낸다.
 */
import dns from 'node:dns/promises';
import { spellCheckByDAUM, spellCheckByNAVER, type SpellCheckTypo } from 'hanspell';
import {
  checkKoreanSpelling,
  checkWithPnu,
  errorText,
  maskUncheckable,
} from '../src/lib/spellcheck';

// 검사기별로 실제로 접속해야 하는 호스트
const HOSTS = [
  { label: '다음', url: 'https://dic.daum.net/grammar_checker.do' },
  { label: '네이버', url: 'https://m.search.naver.com/p/csearch/ocontent/util/SpellerProxy' },
  { label: '부산대', url: 'https://speller.cs.pusan.ac.kr/' },
];

/** 검사기 이전에 네트워크 자체가 되는지부터 가른다. */
async function probeNetwork() {
  console.log(`Node ${process.version}\n`);
  console.log('0) 네트워크 확인 (DNS + 접속)');

  for (const host of HOSTS) {
    const { hostname } = new URL(host.url);

    try {
      const addresses = await dns.lookup(hostname, { all: true });
      console.log(
        `  ${host.label} DNS: ${addresses.map((a) => `${a.address}(v${a.family})`).join(', ')}`
      );
    } catch (error) {
      console.log(`  ${host.label} DNS: 실패 — ${errorText(error)}`);
      continue;
    }

    try {
      const res = await fetch(host.url, { signal: AbortSignal.timeout(10_000) });
      console.log(`  ${host.label} 접속: HTTP ${res.status}`);
    } catch (error) {
      console.log(`  ${host.label} 접속: 실패 — ${errorText(error)}`);
    }
  }

  console.log('');
}

const SAMPLE = '나는 차가운 모래속에 두 손을 넣었다. 이세상의 변두리에 선 느낌이 든다.';

type Checker = typeof spellCheckByDAUM | typeof spellCheckByNAVER;

function run(name: string, checker: Checker): Promise<void> {
  return new Promise((resolve) => {
    const typos: SpellCheckTypo[] = [];
    // hanspell은 실패한 조각마다 error를 부른 뒤 마지막에 end도 부른다.
    let failed = false;

    checker(
      SAMPLE,
      15,
      (found) => typos.push(...found),
      () => {
        if (failed && typos.length === 0) {
          resolve();
          return;
        }
        if (typos.length === 0) {
          console.log(
            `  ${name}: 응답은 왔지만 지적이 0건입니다. (서비스 응답 형식이 바뀌었을 수 있습니다)`
          );
        } else {
          console.log(`  ${name}: ${typos.length}건`);
          typos.forEach((typo) => {
            console.log(`    - ${typo.token} -> ${typo.suggestions.join(', ')}`);
          });
        }
        resolve();
      },
      (error) => {
        failed = true;
        console.log(`  ${name}: 실패 — ${error instanceof Error ? error.message : String(error)}`);
      }
    );
  });
}

async function main() {
  console.log(`검사할 문장: ${SAMPLE}\n`);

  await probeNetwork();

  console.log('1) 마스킹 (코드·URL 제외 처리)');
  const masked = maskUncheckable(SAMPLE);
  console.log(`  길이 보존: ${masked.length === SAMPLE.length ? 'OK' : '깨짐'}`);
  console.log(`  보내는 문장: ${masked}\n`);

  console.log('2) 외부 검사기 직접 호출');
  await run('다음(Daum)  ', spellCheckByDAUM);
  await run('네이버(Naver)', spellCheckByNAVER);

  try {
    const typos = await checkWithPnu(SAMPLE);
    if (typos.length === 0) {
      console.log('  부산대(PNU) : 응답은 왔지만 지적이 0건입니다.');
    } else {
      console.log(`  부산대(PNU) : ${typos.length}건`);
      typos.forEach((typo) => {
        console.log(`    - ${typo.token} -> ${typo.suggestions.join(', ')}`);
      });
    }
  } catch (error) {
    console.log(`  부산대(PNU) : 실패 — ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log('\n3) 에디터가 쓰는 경로 (checkKoreanSpelling)');
  try {
    const result = await checkKoreanSpelling(SAMPLE);
    console.log(`  제공자: ${result.provider}, 지적 ${result.issues.length}건`);
    result.issues.forEach((issue) => {
      console.log(`    - [${issue.start}] ${issue.token} -> ${issue.suggestion} (${issue.info})`);
    });
    if (result.issues.length === 0) {
      console.log('  => 에디터 패널에 "고칠 곳이 없습니다"로 보입니다.');
    }
  } catch (error) {
    console.log(`  실패 — ${error instanceof Error ? error.message : String(error)}`);
    console.log('  => 에디터 패널에 빨간 글씨로 "연결하지 못했습니다"가 뜹니다.');
  }
}

void main();
