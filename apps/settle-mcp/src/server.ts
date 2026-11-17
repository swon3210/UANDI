import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPlaybookPrompt } from './prompts/settle-playbook';
import { registerSettlePrompt } from './prompts/settle-statement';
import { registerResources } from './resources/index';
import { registerCommitBatch } from './tools/commit-batch';
import { registerListStaged } from './tools/list-staged';
import { registerReviewPlaybook } from './tools/review-playbook';
import { registerSaveRule } from './tools/save-rule';
import { registerSetCategory } from './tools/set-category';
import { registerStageTransactions } from './tools/stage-transactions';
import { registerUndoBatch } from './tools/undo-batch';
import type { ToolDeps } from './tools/shared';

export const SERVER_NAME = 'uandi-settle';
export const SERVER_VERSION = '0.0.1';

/** 도구 7개 + 리소스 4개(categories·rules·principles·interview) + 프롬프트 2개(settle-statement·settle-playbook)를 등록한 MCP 서버. 트랜스포트는 호출자가 붙인다 */
export function createServer(deps: ToolDeps): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
  registerStageTransactions(server, deps);
  registerListStaged(server, deps);
  registerSetCategory(server, deps);
  registerSaveRule(server, deps);
  registerCommitBatch(server, deps);
  registerUndoBatch(server, deps);
  registerReviewPlaybook(server, deps);
  registerResources(server, deps);
  registerSettlePrompt(server);
  registerPlaybookPrompt(server);
  return server;
}
