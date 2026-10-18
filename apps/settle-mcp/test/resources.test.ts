import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { INTERVIEW_QUESTIONS } from '../src/core/interview';
import { PRINCIPLE_NUMBERS, PRINCIPLE_TITLES } from '../src/core/principles';
import { INTERVIEW_QUESTION_IDS } from '../src/core/rules';
import {
  parsePrincipleTitles,
  principleHeadlines,
  principleMismatches,
  readPrinciplesMarkdown,
} from '../src/resources/principles';
import { createHarness, type Harness } from './helpers';

describe('원칙 문서 (principles.ko.md)', () => {
  it('1~6 번호와 여섯 굵은 제목이 순서대로 있고 코드의 제목과 같다', async () => {
    const md = await readPrinciplesMarkdown();
    expect(md.startsWith('# 결산할 때 지키는 여섯 가지')).toBe(true);
    expect(parsePrincipleTitles(md).map((t) => t.no)).toEqual([...PRINCIPLE_NUMBERS]);
    expect(parsePrincipleTitles(md).map((t) => t.title)).toEqual(
      PRINCIPLE_NUMBERS.map((no) => PRINCIPLE_TITLES[no])
    );
    expect(principleMismatches(md)).toEqual([]);
  });

  it('문서가 코드와 어긋나면 어디가 다른지 말한다', () => {
    const missing = '# x\n\n1. **나중의 우리를 위해 쓴다.**\n';
    expect(principleMismatches(missing)).toContain('문서에 원칙 2이(가) 없습니다');

    const renamed = PRINCIPLE_NUMBERS.map((no) => `${no}. **${PRINCIPLE_TITLES[no]}.**`)
      .join('\n')
      .replace('같은 돈은 한 번만 적는다', '같은 돈은 두 번 적는다');
    expect(principleMismatches(renamed)[0]).toMatch(/원칙 2 제목이 다릅니다/);

    const extra = PRINCIPLE_NUMBERS.map((no) => `${no}. **${PRINCIPLE_TITLES[no]}.**`)
      .concat('7. **덧붙인 것.**')
      .join('\n');
    expect(principleMismatches(extra)).toContain('문서에 코드가 모르는 번호 7이(가) 있습니다');
  });

  it('결산 시작 때 보여 줄 제목 여섯 줄', () => {
    expect(principleHeadlines()).toHaveLength(6);
    expect(principleHeadlines()[2]).toBe('3. 우리 안에서 오간 돈은 쓴 돈이 아니다');
  });
});

describe('첫 결산 인터뷰 정의', () => {
  it('네 질문이 규칙 파일의 질문 id와 같은 순서이고, 선택형은 기본값이 정확히 하나다', () => {
    expect(INTERVIEW_QUESTIONS.map((q) => q.id)).toEqual([...INTERVIEW_QUESTION_IDS]);
    for (const q of INTERVIEW_QUESTIONS) {
      if (q.kind === 'text') {
        expect(q.choices).toBeUndefined();
        expect(q.format).toBeTruthy();
        continue;
      }
      expect(q.choices!.filter((c) => c.default)).toHaveLength(1);
      expect(new Set(q.choices!.map((c) => c.id)).size).toBe(q.choices!.length);
    }
  });

  it('우리 사이 이체는 선택지가 아니다 — 이름만 묻고, 원칙과 어긋나는 선택지는 번호를 달고 있다', () => {
    const partner = INTERVIEW_QUESTIONS.find((q) => q.id === 'partnerName')!;
    expect(partner.kind).toBe('text');
    expect(partner.principle).toBe(3);
    expect(partner.skipWarning).toMatch(/송금 패턴/);

    const card = INTERVIEW_QUESTIONS.find((q) => q.id === 'cardPayment')!;
    expect(card.choices!.find((c) => c.id === 'byAccount')).toMatchObject({
      needsCategory: true,
      conflictsWith: [2],
    });
    expect(card.choices!.find((c) => c.id === 'byCard')!.conflictsWith).toBeUndefined();
  });
});

describe('리소스 — principles·interview', () => {
  let h: Harness;
  beforeEach(async () => {
    h = await createHarness();
  });
  afterEach(async () => {
    await h.close();
  });

  it('uandi://principles는 로그인 없이도 읽히는 markdown이고 문서 전문과 같다', async () => {
    h.session.connected = false;
    const res = await h.client.readResource({ uri: 'uandi://principles' });
    const content = res.contents[0] as { mimeType: string; text: string };
    expect(content.mimeType).toBe('text/markdown');
    expect(content.text).toBe(await readPrinciplesMarkdown());
  });

  it('uandi://interview는 질문 네 개를 JSON으로 돌려준다', async () => {
    const res = await h.client.readResource({ uri: 'uandi://interview' });
    const body = JSON.parse((res.contents[0] as { text: string }).text) as {
      questions: { id: string; kind: string }[];
    };
    expect(body.questions.map((q) => q.id)).toEqual([
      'cardPayment',
      'partnerName',
      'thirdParty',
      'cashRefund',
    ]);
    expect(body.questions[1]!.kind).toBe('text');
  });

  it('리소스 목록에 네 개가 설명과 함께 올라간다', async () => {
    const list = await h.client.listResources();
    const byUri = Object.fromEntries(list.resources.map((r) => [r.uri, r]));
    expect(Object.keys(byUri).sort()).toEqual([
      'uandi://categories',
      'uandi://interview',
      'uandi://principles',
      'uandi://rules',
    ]);
    expect(byUri['uandi://principles']!.description).toMatch(/사용자가 바꿀 수 없다/);
  });
});
