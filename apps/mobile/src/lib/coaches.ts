/**
 * Built-in Coach Library
 * 5 coaches with 2 Context Slots + 1 Value Lever each.
 * Free: Hook, Outline, Block Breaker. Pro: + Clarity, Decision.
 */

export type BuiltInCoachId = 'hook' | 'outline' | 'clarity' | 'block-breaker' | 'decision';

export interface BuiltInCoachSlot {
  name: string;
  placeholder: string;
  required?: boolean;
}

export interface BuiltInCoachLever {
  name: string;
  minLabel: string;
  maxLabel: string;
}

export interface BuiltInCoach {
  id: BuiltInCoachId;
  title: string;
  description: string;
  /** Free users can use these; Pro users get all */
  proOnly: boolean;
  slots: [BuiltInCoachSlot, BuiltInCoachSlot];
  lever: BuiltInCoachLever;
  /** Prompt template - uses {slot1}, {slot2}, {lever} */
  promptTemplate: string;
}

// Output contract: Summary, Output, Steps, Do this now
const OUTPUT_INSTRUCTIONS = `
Respond in this structure:
## Summary
(1-2 sentences)

## Output
(main content)

## Steps
(numbered list)

## Do this now
(One concrete action to take immediately)
`;

export const BUILT_IN_COACHES: BuiltInCoach[] = [
  {
    id: 'hook',
    title: 'Hook',
    description: 'Start with a strong opening that grabs attention.',
    proOnly: false,
    slots: [
      { name: 'topic', placeholder: "What's your topic or idea?", required: true },
      { name: 'context', placeholder: 'Audience or context (optional)' },
    ],
    lever: { name: 'tone', minLabel: 'Casual', maxLabel: 'Formal' },
    promptTemplate: `You are a writing coach. Help create a compelling hook for: {topic}.
Context: {context} or "general audience".
Tone: {tone} (from casual to formal).
${OUTPUT_INSTRUCTIONS}`,
  },
  {
    id: 'outline',
    title: 'Outline',
    description: 'Structure your content before you write.',
    proOnly: false,
    slots: [
      { name: 'topic', placeholder: "What do you want to outline?", required: true },
      { name: 'goal', placeholder: 'Goal or outcome (optional)' },
    ],
    lever: { name: 'depth', minLabel: 'Simple', maxLabel: 'Detailed' },
    promptTemplate: `You are a content coach. Create an outline for: {topic}.
Goal: {goal} or "clear structure".
Depth: {depth} (simple to detailed).
${OUTPUT_INSTRUCTIONS}`,
  },
  {
    id: 'block-breaker',
    title: 'Block Breaker',
    description: 'Get unstuck when you hit a creative wall.',
    proOnly: false,
    slots: [
      { name: 'block', placeholder: "What's blocking you?", required: true },
      { name: 'tried', placeholder: "What have you tried? (optional)" },
    ],
    lever: { name: 'push', minLabel: 'Gentle', maxLabel: 'Direct' },
    promptTemplate: `You are a productivity coach. Help someone stuck with: {block}.
They've tried: {tried} or "nothing yet".
Coaching style: {push} (gentle to direct).
${OUTPUT_INSTRUCTIONS}`,
  },
  {
    id: 'clarity',
    title: 'Clarity',
    description: 'Cut through the noise and find your core message.',
    proOnly: true,
    slots: [
      { name: 'idea', placeholder: "What's your messy idea?", required: true },
      { name: 'constraint', placeholder: 'Key constraint (optional)' },
    ],
    lever: { name: 'brevity', minLabel: 'Expansive', maxLabel: 'Concise' },
    promptTemplate: `You are a clarity coach. Help clarify: {idea}.
Constraint: {constraint} or "none".
Brevity: {brevity} (expansive to concise).
${OUTPUT_INSTRUCTIONS}`,
  },
  {
    id: 'decision',
    title: 'Decision',
    description: 'Make tough calls with confidence.',
    proOnly: true,
    slots: [
      { name: 'decision', placeholder: "What decision are you facing?", required: true },
      { name: 'options', placeholder: 'Options or tradeoffs (optional)' },
    ],
    lever: { name: 'urgency', minLabel: 'Low', maxLabel: 'High' },
    promptTemplate: `You are a decision coach. Help with: {decision}.
Options/tradeoffs: {options} or "still exploring".
Urgency: {urgency} (low to high).
${OUTPUT_INSTRUCTIONS}`,
  },
];

export const FREE_COACH_IDS: BuiltInCoachId[] = ['hook', 'outline', 'block-breaker'];
export const PRO_COACH_IDS: BuiltInCoachId[] = ['hook', 'outline', 'block-breaker', 'clarity', 'decision'];

export function getBuiltInCoach(id: BuiltInCoachId): BuiltInCoach | undefined {
  return BUILT_IN_COACHES.find((c) => c.id === id);
}

export function isProOnlyCoach(id: BuiltInCoachId): boolean {
  return getBuiltInCoach(id)?.proOnly ?? false;
}
