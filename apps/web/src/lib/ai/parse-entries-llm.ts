import type OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import {
  PARSE_MODEL,
  parseOutputSchema,
  fromParseOutput,
  type ParseResponse,
} from '@/lib/ai/parse-entries-core';

/**
 * 가계부 파싱 모델 1회 호출 (서버 전용).
 *
 * 이미지는 **1장당 1회 호출**이 원칙이다. 여러 장을 한 호출에 넣으면
 * (1) 결과가 MAX_ENTRIES(100건) 하나로 묶여 잘리고, (2) 모델이 행을 건너뛰기 쉽다.
 * 호출자는 이미지별로 이 함수를 병렬 실행하고 결과를 합친다.
 */
export async function parseEntriesWithModel(options: {
  client: OpenAI;
  systemPrompt: string;
  /** data URL 또는 https URL. 없으면 텍스트만 파싱. PDF 페이지도 클라이언트가 이미지로 렌더링해 보낸다. */
  imageUrl?: string;
  text: string;
  /** 에러 로그 식별자 */
  tag: string;
}): Promise<ParseResponse> {
  const { client, systemPrompt, imageUrl, text, tag } = options;

  const content: OpenAI.Responses.ResponseInputContent[] = [];
  if (imageUrl) {
    // 영수증·거래내역 OCR은 원본 해상도 유지가 정확도에 유리 (Responses API 전용 detail 값)
    content.push({ type: 'input_image', image_url: imageUrl, detail: 'original' });
  }
  content.push({ type: 'input_text', text });

  const response = await client.responses.parse({
    model: PARSE_MODEL,
    // 가계부 원문·이미지를 OpenAI 측에 저장하지 않는다
    store: false,
    // 추론 토큰 + 최대 100건 JSON 출력을 모두 수용하도록 넉넉히 확보
    max_output_tokens: 16000,
    // OCR/추출 위주 작업이라 낮은 추론 강도로도 충분 (필요 시 'medium'까지 상향)
    reasoning: { effort: 'low' },
    instructions: systemPrompt,
    input: [{ role: 'user', content }],
    // Structured Outputs(strict): 스키마 준수가 보장되어 후처리 파싱 실패가 사라진다
    text: { format: zodTextFormat(parseOutputSchema, 'parse_entries') },
  });

  if (!response.output_parsed) {
    console.error(`[${tag}] 빈 응답`, {
      status: response.status,
      incomplete: response.incomplete_details,
    });
    throw new Error(`빈 응답 (status=${response.status})`);
  }

  return fromParseOutput(response.output_parsed);
}
